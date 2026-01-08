import { 
  User, InsertUser, Product, InsertProduct, Order, InsertOrder, 
  OrderItem, InsertOrderItem, Shipment, InsertShipment, TrackingLog, 
  InsertTrackingLog, users, products, orders, orderItems, shipments, trackingLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProducts(category?: string, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(userId: number): Promise<(Order & { items: OrderItem[], shipment?: Shipment })[]>;
  getOrder(id: number): Promise<(Order & { items: OrderItem[], shipment?: Shipment }) | undefined>;

  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipmentByTracking(trackingNumber: string): Promise<(Shipment & { logs: TrackingLog[] }) | undefined>;
  addTrackingLog(log: InsertTrackingLog): Promise<TrackingLog>;

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
    let query = db.select().from(products);
    // Note: Simple filtering for MVP. For search, we might want ILIKE
    if (category) {
      query = query.where(eq(products.category, category)) as any;
    }
    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
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
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    
    // Fetch items and shipment for each order
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

  async addTrackingLog(log: InsertTrackingLog): Promise<TrackingLog> {
    const [newLog] = await db.insert(trackingLogs).values(log).returning();
    // Update shipment status as well
    await db.update(shipments)
      .set({ status: log.status })
      .where(eq(shipments.id, log.shipmentId));
    return newLog;
  }
}

export const storage = new DatabaseStorage();
