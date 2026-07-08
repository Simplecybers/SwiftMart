import { 
  User, InsertUser, Product, InsertProduct, Order, InsertOrder, 
  OrderItem, InsertOrderItem, Shipment, InsertShipment, TrackingLog, 
  InsertTrackingLog, Task, InsertTask,
  users, products, orders, orderItems, shipments, trackingLogs, tasks
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray, or, ilike, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProducts(category?: string, search?: string): Promise<Product[]>;
  getProductsByVendor(vendorId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(userId: number): Promise<(Order & { items: OrderItem[], shipment?: Shipment })[]>;
  getOrder(id: number): Promise<(Order & { items: OrderItem[], shipment?: Shipment }) | undefined>;
  updateOrderStatus(orderId: number, status: string): Promise<Order>;

  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipmentByTracking(trackingNumber: string): Promise<(Shipment & { logs: TrackingLog[] }) | undefined>;
  getShipmentByOrderId(orderId: number): Promise<Shipment | undefined>;
  addTrackingLog(log: InsertTrackingLog): Promise<TrackingLog>;
  updateShipmentStatus(shipmentId: number, status: string): Promise<Shipment>;

  getTasks(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(taskId: number, task: Partial<InsertTask>): Promise<Task>;
  getAllTasks(): Promise<Task[]>;

  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getProducts(category?: string, search?: string): Promise<Product[]> {
    const conditions = [];
    if (category && category !== "All") {
      conditions.push(eq(products.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.category, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return await db.select().from(products).where(and(...conditions)).orderBy(desc(products.id));
    }
    return await db.select().from(products).orderBy(desc(products.id));
  }

  async getProductsByVendor(vendorId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.id));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();
      
      if (items.length > 0) {
        await tx.insert(orderItems).values(
          items.map(item => ({ ...item, orderId: newOrder.id }))
        );
      }
      
      return newOrder;
    });
  }

  async getOrders(userId: number): Promise<(Order & { items: OrderItem[], shipment?: Shipment })[]> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    let userOrders;
    
    if (user?.role === 'admin') {
      userOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    } else if (user?.role === 'vendor') {
      // For vendors, we only show orders that contain their products
      const vendorProducts = await db.select().from(products).where(eq(products.vendorId, userId));
      const vendorProductIds = vendorProducts.map(p => p.id);
      
      if (vendorProductIds.length === 0) return [];
      
      const vendorOrderItems = await db.select().from(orderItems).where(inArray(orderItems.productId, vendorProductIds));
      const orderIds = [...new Set(vendorOrderItems.map(oi => oi.orderId))];
      
      if (orderIds.length === 0) return [];
      
      userOrders = await db.select().from(orders).where(inArray(orders.id, orderIds)).orderBy(desc(orders.createdAt));
    } else {
      userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    }
    
    const results = await Promise.all(userOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, order.id));
      return { ...order, items, shipment };
    }));

    return results;
  }

  async getOrder(id: number): Promise<(Order & { items: OrderItem[], shipment?: Shipment }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, id));

    return { ...order, items, shipment };
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
    return updated;
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const [newShipment] = await db.insert(shipments).values(shipment).returning();
    return newShipment;
  }

  async getShipmentByTracking(trackingNumber: string): Promise<(Shipment & { logs: TrackingLog[] }) | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.trackingNumber, trackingNumber));
    if (!shipment) return undefined;

    const logs = await db.select().from(trackingLogs).where(eq(trackingLogs.shipmentId, shipment.id)).orderBy(desc(trackingLogs.timestamp));
    
    return { ...shipment, logs };
  }

  async getShipmentByOrderId(orderId: number): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, orderId));
    return shipment;
  }

  async addTrackingLog(log: InsertTrackingLog): Promise<TrackingLog> {
    const [newLog] = await db.insert(trackingLogs).values(log).returning();
    await db.update(shipments)
      .set({ status: log.status })
      .where(eq(shipments.id, log.shipmentId));
    return newLog;
  }

  async updateShipmentStatus(shipmentId: number, status: string): Promise<Shipment> {
    const [updated] = await db.update(shipments).set({ status: status as any }).where(eq(shipments.id, shipmentId)).returning();
    return updated;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(taskId: number, task: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks).set(task).where(eq(tasks.id, taskId)).returning();
    return updated;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.id));
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ role: role as any }).where(eq(users.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
