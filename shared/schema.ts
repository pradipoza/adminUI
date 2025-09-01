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
  password: varchar("password").notNull(), // Hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table for knowledge base
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chunks table for vector embeddings
export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding"), // pgvector column for embeddings
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for WhatsApp chat logs (WhatsApp Account 1)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for WhatsApp chat logs (WhatsApp Account 2)
export const messages1 = pgTable("messages1", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table for storing student information
export const students = pgTable("students", {
  whatsappId: text("whatsapp_id").primaryKey(),
  name: text("name"),
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

// Zod schemas
export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  filename: true,
  content: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  message: true,
});

export const insertMessage1Schema = createInsertSchema(messages1).pick({
  sessionId: true,
  message: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  whatsappId: true,
  name: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
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
