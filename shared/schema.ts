import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["customer", "vendor", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "shipped", "completed", "cancelled"]);
export const shipmentStatusEnum = pgEnum("shipment_status", ["order_placed", "processing", "shipped", "in_transit", "out_for_delivery", "delivered"]);
export const paymentMethodEnum = pgEnum("payment_method", ["card", "crypto", "gift_card"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["customer", "vendor", "admin"] }).default("customer").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(), // References users.id
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References users.id
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "paid", "shipped", "completed", "cancelled"] }).default("pending").notNull(),
  paymentMethod: text("payment_method", { enum: ["card", "crypto", "gift_card"] }),
  paymentDetails: text("payment_details"), // JSON or transaction hash
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Assigned to
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["todo", "in_progress", "completed"] }).default("todo").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(), // References orders.id
  productId: integer("product_id").notNull(), // References products.id
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(), // References orders.id
  trackingNumber: text("tracking_number").notNull().unique(),
  carrier: text("carrier").notNull(),
  status: text("status", { enum: ["order_placed", "processing", "shipped", "in_transit", "out_for_delivery", "delivered"] }).default("order_placed").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
});

export const trackingLogs = pgTable("tracking_logs", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id").notNull(), // References shipments.id
  status: text("status", { enum: ["order_placed", "processing", "shipped", "in_transit", "out_for_delivery", "delivered"] }).notNull(),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  note: text("note"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  products: many(products),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  vendor: one(users, {
    fields: [products.vendorId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  shipment: one(shipments, {
    fields: [orders.id],
    references: [shipments.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  logs: many(trackingLogs),
}));

export const trackingLogsRelations = relations(trackingLogs, ({ one }) => ({
  shipment: one(shipments, {
    fields: [trackingLogs.shipmentId],
    references: [shipments.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertShipmentSchema = createInsertSchema(shipments).omit({ id: true });
export const insertTrackingLogSchema = createInsertSchema(trackingLogs).omit({ id: true, timestamp: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type TrackingLog = typeof trackingLogs.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
