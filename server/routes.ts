import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { users as usersTable } from "@shared/schema";
import { insertProductSchema, insertTaskSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (!roles.includes(user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

const ORDER_STATUS_TO_SHIPMENT_STATUS: Record<string, string | undefined> = {
  paid: "processing",
  shipped: "shipped",
  completed: "delivered",
  cancelled: undefined,
};

// Multer setup for image uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });

  // ---------- Image Upload ----------
  app.post("/api/upload", requireAuth, upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // ---------- Products ----------
  app.get(api.products.list.path, async (req, res) => {
    const { category, search } = req.query as { category?: string; search?: string };
    const products = await storage.getProducts(category, search);
    res.json(products);
  });

  app.get("/api/vendor/products", requireRole("vendor", "admin"), async (req, res) => {
    const user = req.user as any;
    const products = user.role === "admin"
      ? await storage.getProducts()
      : await storage.getProductsByVendor(user.id);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, requireRole("vendor", "admin"), async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertProductSchema.parse({
        ...req.body,
        vendorId: user.role === "admin" && req.body.vendorId ? Number(req.body.vendorId) : user.id,
      });
      const product = await storage.createProduct(parsed);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", requireRole("vendor", "admin"), async (req, res) => {
    const user = req.user as any;
    const id = Number(req.params.id);
    const existing = await storage.getProduct(id);
    if (!existing) return res.status(404).json({ message: "Product not found" });
    if (user.role !== "admin" && existing.vendorId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const parsed = insertProductSchema.partial().parse(req.body);
      const updated = await storage.updateProduct(id, parsed);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", requireRole("vendor", "admin"), async (req, res) => {
    const user = req.user as any;
    const id = Number(req.params.id);
    const existing = await storage.getProduct(id);
    if (!existing) return res.status(404).json({ message: "Product not found" });
    if (user.role !== "admin" && existing.vendorId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteProduct(id);
    res.status(204).send();
  });

  // ---------- Orders ----------
  app.post(api.orders.create.path, requireAuth, async (req, res) => {
    const user = req.user as any;

    const { items, paymentMethod, paymentDetails } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      const price = Number(product.price);
      totalAmount += price * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const order = await storage.createOrder({
      userId: user.id,
      totalAmount: totalAmount.toFixed(2),
      status: "awaiting_confirmation",
      paymentMethod: paymentMethod || "crypto",
      paymentDetails: typeof paymentDetails === "string" ? paymentDetails : JSON.stringify(paymentDetails || {}),
    }, orderItemsData);

    // Decrement stock
    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        await storage.updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
      }
    }

    // Create shipment + first tracking log
    const trackingNumber = `GS-${Math.floor(Math.random() * 10000)}-${Date.now().toString().slice(-4)}`;
    const shipment = await storage.createShipment({
      orderId: order.id,
      trackingNumber,
      carrier: "GlobalExpress",
      status: "order_placed",
    });

    await storage.addTrackingLog({
      shipmentId: shipment.id,
      status: "order_placed",
      location: "Origin Warehouse",
      note: "Order received, awaiting payment confirmation from our team.",
    });

    res.status(201).json({ ...order, trackingNumber });
  });

  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    const orders = await storage.getOrders(user.id);
    res.json(orders);
  });

  app.get(api.orders.get.path, requireAuth, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    const user = req.user as any;
    if (user.role === "customer" && order.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(order);
  });

  app.patch("/api/orders/:id/status", requireRole("admin", "vendor"), async (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body as { status: string };
    const validStatuses = ["pending", "paid", "awaiting_confirmation", "shipped", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await storage.updateOrderStatus(orderId, status);
    if (!updated) return res.status(404).json({ message: "Order not found" });

    // Keep shipment + tracking log in sync with order status changes
    const shipment = await storage.getShipmentByOrderId(orderId);
    const shipmentStatus = ORDER_STATUS_TO_SHIPMENT_STATUS[status];
    if (shipment && shipmentStatus) {
      await storage.addTrackingLog({
        shipmentId: shipment.id,
        status: shipmentStatus as any,
        location: shipmentStatus === "delivered" ? "Destination" : "Distribution Center",
        note: `Order status updated to "${status.replace(/_/g, " ")}".`,
      });
    }

    res.json(updated);
  });

  // ---------- Admin: Users ----------
  app.get("/api/admin/users", requireRole("admin"), async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(({ password, ...safe }) => safe));
  });

  app.patch("/api/admin/users/:id/role", requireRole("admin"), async (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body as { role: string };
    if (!["customer", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const updated = await storage.updateUserRole(id, role);
    if (!updated) return res.status(404).json({ message: "User not found" });
    const { password, ...safe } = updated;
    res.json(safe);
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteUser(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.status(204).send();
  });

  // ---------- Tasks (internal ops board for admins) ----------
  app.get("/api/tasks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const tasks = user.role === "admin" ? await storage.getAllTasks() : await storage.getTasks(user.id);
    res.json(tasks);
  });

  app.post("/api/tasks", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(parsed);
      res.status(201).json(task);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", requireRole("admin"), async (req, res) => {
    const updated = await storage.updateTask(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/tasks/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // ---------- Tracking ----------
  app.get(api.tracking.get.path, async (req, res) => {
    const shipment = await storage.getShipmentByTracking(req.params.trackingNumber);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    res.json(shipment);
  });

  app.post(api.tracking.update.path, requireRole("admin", "vendor"), async (req, res) => {
    const trackingNumber = req.params.trackingNumber;
    const shipment = await storage.getShipmentByTracking(trackingNumber);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const log = await storage.addTrackingLog({
      shipmentId: shipment.id,
      ...req.body,
    });
    res.status(201).json(log);
  });

  await seedData();

  return httpServer;
}

async function seedData() {
  const products = await storage.getProducts();
  if (products.length > 0) return;

  const demoPassword = await hashPassword("password");

  const admin = await storage.createUser({
    username: "demo",
    password: demoPassword,
    name: "Demo Admin",
    role: "admin",
  } as any);

  const vendor1 = await storage.createUser({
    username: "vendor",
    password: demoPassword,
    name: "Global Gadgets Co.",
    role: "vendor",
  } as any);

  const vendor2 = await storage.createUser({
    username: "vendor2",
    password: demoPassword,
    name: "Urban Style Trading",
    role: "vendor",
  } as any);

  const customer = await storage.createUser({
    username: "customer",
    password: demoPassword,
    name: "Jamie Customer",
    role: "customer",
  } as any);

  const catalog = [
    { vendorId: vendor1.id, name: "Wireless Bluetooth Earbuds", description: "True wireless earbuds with active noise cancellation, 30-hour battery life, and IPX7 waterproofing.", price: "18.99", stock: 340, imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=60", category: "Electronics" },
    { vendorId: vendor1.id, name: "Smart Fitness Watch", description: "Track heart rate, sleep, and workouts with this sleek smartwatch. Compatible with iOS and Android.", price: "24.99", stock: 210, imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=60", category: "Electronics" },
    { vendorId: vendor1.id, name: "Portable Phone Charger 20000mAh", description: "High-capacity power bank with fast charging for phones and tablets.", price: "15.49", stock: 500, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&auto=format&fit=crop&q=60", category: "Electronics" },
    { vendorId: vendor1.id, name: "LED Strip Lights 16.4ft", description: "RGB LED lights with remote control, perfect for room and desk ambiance.", price: "9.99", stock: 620, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=60", category: "Electronics" },
    { vendorId: vendor1.id, name: "Mini Bluetooth Speaker", description: "Compact speaker with rich bass and 12-hour playtime.", price: "12.99", stock: 275, imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=60", category: "Electronics" },
    { vendorId: vendor1.id, name: "USB-C Fast Charging Cable 3-Pack", description: "Durable braided cables compatible with most modern devices.", price: "7.99", stock: 800, imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=60", category: "Electronics" },

    { vendorId: vendor2.id, name: "Oversized Knit Sweater", description: "Cozy oversized sweater made from soft blended yarn, perfect for fall and winter.", price: "22.99", stock: 180, imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&auto=format&fit=crop&q=60", category: "Fashion" },
    { vendorId: vendor2.id, name: "Running Shoes Unisex", description: "Comfortable running shoes with breathable mesh and cushioned sole for all terrains.", price: "29.99", stock: 260, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60", category: "Fashion" },
    { vendorId: vendor2.id, name: "Classic Denim Jacket", description: "Timeless denim jacket with a relaxed fit, great for layering.", price: "27.49", stock: 150, imageUrl: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&auto=format&fit=crop&q=60", category: "Fashion" },
    { vendorId: vendor2.id, name: "Minimalist Analog Watch", description: "Elegant stainless steel watch with a leather strap.", price: "19.99", stock: 220, imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=60", category: "Fashion" },
    { vendorId: vendor2.id, name: "Canvas Tote Bag", description: "Durable everyday tote bag with inner pocket, great for shopping or the beach.", price: "8.99", stock: 400, imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=60", category: "Fashion" },

    { vendorId: vendor1.id, name: "Ceramic Coffee Mug Set (4-Piece)", description: "Elegant ceramic mugs, microwave and dishwasher safe.", price: "16.99", stock: 190, imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&auto=format&fit=crop&q=60", category: "Home" },
    { vendorId: vendor1.id, name: "Aromatherapy Essential Oil Diffuser", description: "Ultrasonic diffuser with 7 LED color modes and auto shut-off.", price: "21.99", stock: 160, imageUrl: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600&auto=format&fit=crop&q=60", category: "Home" },
    { vendorId: vendor1.id, name: "Non-Stick Frying Pan Set", description: "3-piece non-stick cookware set for everyday cooking.", price: "34.99", stock: 130, imageUrl: "https://images.unsplash.com/photo-1584990347449-a4b1c8c1de92?w=600&auto=format&fit=crop&q=60", category: "Home" },
    { vendorId: vendor2.id, name: "Memory Foam Pillow", description: "Ergonomic contour pillow for neck and shoulder support.", price: "13.99", stock: 300, imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=600&auto=format&fit=crop&q=60", category: "Home" },

    { vendorId: vendor2.id, name: "Hydrating Face Serum", description: "Vitamin C serum for brightening and hydrating skin.", price: "14.99", stock: 350, imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=60", category: "Beauty" },
    { vendorId: vendor2.id, name: "Makeup Brush Set (12-Piece)", description: "Professional makeup brushes with synthetic bristles and travel case.", price: "17.99", stock: 240, imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=60", category: "Beauty" },
    { vendorId: vendor2.id, name: "Electric Facial Cleansing Brush", description: "Silicone facial cleansing device for deep pore cleaning.", price: "19.99", stock: 200, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=60", category: "Beauty" },

    { vendorId: vendor1.id, name: "Adjustable Dumbbell Set", description: "Space-saving adjustable dumbbells, 5-25lbs per hand.", price: "39.99", stock: 90, imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=60", category: "Sports" },
    { vendorId: vendor1.id, name: "Yoga Mat with Carry Strap", description: "Extra thick non-slip yoga mat, eco-friendly TPE material.", price: "11.99", stock: 320, imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=60", category: "Sports" },
    { vendorId: vendor1.id, name: "Resistance Bands Set", description: "5 resistance levels for strength training and rehab.", price: "9.49", stock: 400, imageUrl: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=600&auto=format&fit=crop&q=60", category: "Sports" },

    { vendorId: vendor2.id, name: "Building Blocks Set (500pcs)", description: "Creative building block set compatible with major brands, great for kids.", price: "23.99", stock: 170, imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=60", category: "Toys" },
    { vendorId: vendor2.id, name: "Remote Control Race Car", description: "High-speed RC car with rechargeable battery, ages 6+.", price: "26.99", stock: 140, imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=60", category: "Toys" },
  ];

  const createdProducts = [];
  for (const p of catalog) {
    createdProducts.push(await storage.createProduct(p as any));
  }

  const sampleOrderConfigs = [
    { buyer: customer, product: createdProducts[0], qty: 2, paymentMethod: "crypto", status: "paid" },
    { buyer: customer, product: createdProducts[1], qty: 1, paymentMethod: "crypto", status: "awaiting_confirmation" },
    { buyer: customer, product: createdProducts[6], qty: 1, paymentMethod: "gift_card", status: "awaiting_confirmation" },
    { buyer: customer, product: createdProducts[11], qty: 3, paymentMethod: "crypto", status: "shipped" },
    { buyer: customer, product: createdProducts[17], qty: 1, paymentMethod: "gift_card", status: "completed" },
  ];

  for (const cfg of sampleOrderConfigs) {
    const price = Number(cfg.product.price);
    const order = await storage.createOrder({
      userId: cfg.buyer.id,
      totalAmount: (price * cfg.qty).toFixed(2),
      status: cfg.status as any,
      paymentMethod: cfg.paymentMethod as any,
      paymentDetails: JSON.stringify(
        cfg.paymentMethod === "crypto"
          ? { currency: "usdt", walletAddress: "TXn9a...4fQ2", txHash: "0xa1b2c3d4e5f6" }
          : { cardName: "Amazon", cardType: "e-code", code: "AMZN-XXXX-YYYY" }
      ),
    }, [{ productId: cfg.product.id, quantity: cfg.qty, price: cfg.product.price }]);

    const trackingNumber = `GS-${Math.floor(Math.random() * 10000)}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
    const shipmentStatus =
      cfg.status === "completed" ? "delivered" :
      cfg.status === "shipped" ? "in_transit" : "order_placed";

    const shipment = await storage.createShipment({
      orderId: order.id,
      trackingNumber,
      carrier: "GlobalExpress",
      status: shipmentStatus as any,
    });

    await storage.addTrackingLog({
      shipmentId: shipment.id,
      status: "order_placed",
      location: "Origin Warehouse",
      note: "Order has been placed and is being processed.",
    });

    if (shipmentStatus === "in_transit" || shipmentStatus === "delivered") {
      await storage.addTrackingLog({
        shipmentId: shipment.id,
        status: "shipped",
        location: "Regional Distribution Center",
        note: "Package has left the warehouse.",
      });
      await storage.addTrackingLog({
        shipmentId: shipment.id,
        status: "in_transit",
        location: "Transit Hub",
        note: "Package is on its way to the destination.",
      });
    }
    if (shipmentStatus === "delivered") {
      await storage.addTrackingLog({
        shipmentId: shipment.id,
        status: "delivered",
        location: "Customer Address",
        note: "Package has been delivered.",
      });
    }
  }

  await storage.createTask({
    userId: admin.id,
    title: "Verify pending crypto payments",
    description: "Review awaiting_confirmation orders and confirm valid transactions.",
    status: "todo",
    priority: "high",
  } as any);

  await storage.createTask({
    userId: admin.id,
    title: "Onboard new vendor: Urban Style Trading",
    description: "Confirm catalog listings meet quality guidelines.",
    status: "completed",
    priority: "medium",
  } as any);
}
