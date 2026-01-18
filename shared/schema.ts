import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  serial,
  customType,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'client']);

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('client').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table for knowledge base
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  clientId: varchar("client_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chunks table for vector embeddings
export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for WhatsApp chat logs (WhatsApp Account 1)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: jsonb("message").notNull(),
  clientId: varchar("client_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for WhatsApp chat logs (WhatsApp Account 2)
export const messages1 = pgTable("messages1", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: jsonb("message").notNull(),
  clientId: varchar("client_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table for storing student information
export const students = pgTable("students", {
  whatsappId: text("whatsapp_id").primaryKey(),
  name: text("name"),
  clientId: varchar("client_id").references(() => users.id),
});

// Payments table for tracking client payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  month: varchar("month").notNull(),
  year: integer("year").notNull(),
  aiMessageCount: integer("ai_message_count").default(0).notNull(),
  ratePerMessage: decimal("rate_per_message", { precision: 10, scale: 2 }).default('1.50').notNull(),
  totalDue: decimal("total_due", { precision: 10, scale: 2 }).default('0').notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0').notNull(),
  status: varchar("status").default('pending').notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings table for super admin settings (like QR code)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").unique().notNull(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertChunk = typeof chunks.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;

export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;

export type InsertMessage1 = typeof messages1.$inferInsert;
export type Message1 = typeof messages1.$inferSelect;

export type InsertStudent = typeof students.$inferInsert;
export type Student = typeof students.$inferSelect;

export type InsertPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;

export type InsertSetting = typeof settings.$inferInsert;
export type Setting = typeof settings.$inferSelect;

// Zod schemas
export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  filename: true,
  content: true,
  clientId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  message: true,
  clientId: true,
});

export const insertMessage1Schema = createInsertSchema(messages1).pick({
  sessionId: true,
  message: true,
  clientId: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  whatsappId: true,
  name: true,
  clientId: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  clientId: true,
  month: true,
  year: true,
  aiMessageCount: true,
  ratePerMessage: true,
  totalDue: true,
  amountPaid: true,
  status: true,
  notes: true,
});

export const updatePaymentSchema = z.object({
  amountPaid: z.string().optional(),
  status: z.enum(['pending', 'partial', 'paid']).optional(),
  notes: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

export const updateProfileSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  currentPassword: z.string().min(1, "Current password is required").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});
