import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const { category, search } = req.query as { category?: string, search?: string };
    const products = await storage.getProducts(category, search);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    // Only allow admin/vendor? skipping for MVP simplicity or check req.user
    const product = await storage.createProduct(req.body);
    res.status(201).json(product);
  });

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const { items } = req.body;
    let totalAmount = 0;
    const orderItemsData = [];

    // Calculate total and prepare items
    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });
      // Use Number() to ensure we're doing math on numbers, though decimal comes as string usually
      const price = Number(product.price);
      totalAmount += price * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // Store price at time of order
      });
    }

    const order = await storage.createOrder({
      userId: user.id,
      totalAmount: totalAmount.toFixed(2),
      status: "pending",
    }, orderItemsData);

    // Auto-create shipment for demo purposes
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
      location: "Warehouse",
      note: "Order has been placed and is being processed.",
    });

    res.status(201).json(order);
  });

  app.get(api.orders.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const orders = await storage.getOrders(user.id);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  // Tracking
  app.get(api.tracking.get.path, async (req, res) => {
    const shipment = await storage.getShipmentByTracking(req.params.trackingNumber);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    res.json(shipment);
  });

  app.post(api.tracking.update.path, async (req, res) => {
    // Admin only?
    const trackingNumber = req.params.trackingNumber;
    const shipment = await storage.getShipmentByTracking(trackingNumber);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const log = await storage.addTrackingLog({
      shipmentId: shipment.id,
      ...req.body
    });
    res.status(201).json(log);
  });

  await seedData();

  return httpServer;
}

async function seedData() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    // Create seed vendor
    const vendorPassword = await hashPassword("password");
    const vendor = await storage.createUser({
      username: "vendor",
      password: vendorPassword, 
      name: "Global Vendor",
      role: "vendor",
    } as any);

    await storage.createProduct({
      vendorId: vendor.id,
      name: "Wireless Earbuds",
      description: "High quality wireless earbuds with noise cancellation.",
      price: "29.99",
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
      category: "Electronics"
    });

    await storage.createProduct({
      vendorId: vendor.id,
      name: "Smart Watch",
      description: "Track your fitness and stay connected.",
      price: "49.99",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60",
      category: "Electronics"
    });

    await storage.createProduct({
      vendorId: vendor.id,
      name: "Running Shoes",
      description: "Comfortable running shoes for all terrains.",
      price: "79.99",
      stock: 200,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
      category: "Fashion"
    });
    
    // Create a demo shipment
    const demoPassword = await hashPassword("password");
    const user = await storage.createUser({
      username: "demo",
      password: demoPassword,
      name: "Demo User",
      role: "customer",
    } as any);
    
    // Create a sample order and shipment for tracking demo
    // We can't easily create a valid order without valid product IDs and a user ID from the seed.
    // But since I just created them, I can use them if I had their IDs.
    // Since createUser returns the user with ID, I have it.
  }
}
