import {
  users,
  documents,
  chunks,
  messages,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Chunk,
  type InsertChunk,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Chunk operations
  getChunksByDocumentId(documentId: number): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  deleteChunksByDocumentId(documentId: number): Promise<void>;
  
  // Message operations
  getMessages(sessionId?: string): Promise<Message[]>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getActiveSessions(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]>;
  getMessageStats(): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Chunk operations
  async getChunksByDocumentId(documentId: number): Promise<Chunk[]> {
    return await db.select().from(chunks).where(eq(chunks.documentId, documentId));
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    const [newChunk] = await db.insert(chunks).values(chunk).returning();
    return newChunk;
  }

  async deleteChunksByDocumentId(documentId: number): Promise<void> {
    await db.delete(chunks).where(eq(chunks.documentId, documentId));
  }

  // Message operations
  async getMessages(sessionId?: string): Promise<Message[]> {
    if (sessionId) {
      return await db.select().from(messages)
        .where(eq(messages.sessionId, sessionId))
        .orderBy(asc(messages.createdAt));
    }
    return await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(100);
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getActiveSessions(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]> {
    const result = await db
      .select({
        sessionId: messages.sessionId,
        messageCount: sql<number>`count(*)`,
        lastActivity: sql<Date>`max(${messages.createdAt})`,
      })
      .from(messages)
      .groupBy(messages.sessionId)
      .orderBy(sql`max(${messages.createdAt}) desc`)
      .limit(10);
    
    return result;
  }

  async getMessageStats(): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);

    const [weeklyResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '7 days'`);

    const [monthlyResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '30 days'`);

    const dailyMessages = await db
      .select({
        date: sql<string>`date_trunc('day', ${messages.createdAt})::date`,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '7 days'`)
      .groupBy(sql`date_trunc('day', ${messages.createdAt})`)
      .orderBy(sql`date_trunc('day', ${messages.createdAt})`);

    return {
      totalMessages: totalResult.count,
      dailyMessages,
      weeklyMessages: weeklyResult.count,
      monthlyMessages: monthlyResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
