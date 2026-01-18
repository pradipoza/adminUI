import {
  users,
  documents,
  chunks,
  messages,
  messages1,
  students,
  payments,
  settings,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Chunk,
  type InsertChunk,
  type Message,
  type InsertMessage,
  type Message1,
  type InsertMessage1,
  type Student,
  type InsertStudent,
  type Payment,
  type InsertPayment,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, ne } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllClients(): Promise<User[]>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Chunk operations
  getChunksByDocumentId(documentId: number): Promise<Chunk[]>;
  getAllChunks(): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  deleteChunksByDocumentId(documentId: number): Promise<void>;
  searchSimilarChunks(queryEmbedding: number[], limit?: number): Promise<{ chunkText: string; similarity: number }[]>;
  
  // Message operations (WhatsApp Account 1)
  getMessages(sessionId?: string): Promise<Message[]>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getActiveSessions(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]>;
  getMessageStats(timeRange?: string): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }>;
  getWeeklyActivity(): Promise<{ day: string; messages: number }[]>;
  getTotalStudents(): Promise<number>;
  getAIMessageCount(clientId?: string): Promise<number>;
  
  // Message operations (WhatsApp Account 2)
  getMessages1(sessionId?: string): Promise<Message1[]>;
  getMessagesBySession1(sessionId: string): Promise<Message1[]>;
  createMessage1(message: InsertMessage1): Promise<Message1>;
  getActiveSessions1(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]>;
  getMessageStats1(): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(whatsappId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(whatsappId: string, updates: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(whatsappId: string): Promise<void>;
  
  // Payment operations
  getPayments(clientId?: string): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<InsertPayment>): Promise<Payment>;
  getClientPaymentDue(clientId: string): Promise<{ totalDue: number; amountPaid: number; balance: number }>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  
  // Super admin analytics
  getSuperAdminAnalytics(): Promise<{
    totalClients: number;
    totalMessages: number;
    totalStudents: number;
    totalRevenue: number;
    pendingPayments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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

  async getAllClients(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'client')).orderBy(desc(users.createdAt));
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

  async getAllChunks(): Promise<Chunk[]> {
    return await db.select().from(chunks);
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    const [newChunk] = await db.insert(chunks).values(chunk).returning();
    return newChunk;
  }

  async deleteChunksByDocumentId(documentId: number): Promise<void> {
    await db.delete(chunks).where(eq(chunks.documentId, documentId));
  }

  async searchSimilarChunks(queryEmbedding: number[], limit: number = 3): Promise<{ chunkText: string; similarity: number }[]> {
    const results = await db.execute(
      sql`SELECT chunk_text, 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity 
          FROM chunks 
          WHERE embedding IS NOT NULL 
          ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector 
          LIMIT ${limit}`
    );
    
    return results.rows.map((row: any) => ({
      chunkText: row.chunk_text,
      similarity: parseFloat(row.similarity)
    }));
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

  async getMessageStats(timeRange: string = '7days'): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }> {
    const intervalMap: { [key: string]: string } = {
      '1day': '1 day',
      '7days': '7 days', 
      '30days': '30 days',
      '6months': '6 months',
      '1year': '1 year'
    };
    
    const interval = intervalMap[timeRange] || '7 days';
    
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '${sql.raw(interval)}'`);

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
      .where(sql`${messages.createdAt} >= current_date - interval '${sql.raw(interval)}'`)
      .groupBy(sql`date_trunc('day', ${messages.createdAt})`)
      .orderBy(sql`date_trunc('day', ${messages.createdAt})`);

    return {
      totalMessages: totalResult.count,
      dailyMessages,
      weeklyMessages: weeklyResult.count,
      monthlyMessages: monthlyResult.count,
    };
  }
  
  async getTotalStudents(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students);
    return result.count;
  }

  async getAIMessageCount(clientId?: string): Promise<number> {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM messages WHERE message->>'type' = 'ai'`
    );
    return parseInt((result.rows[0] as any)?.count || '0');
  }

  async getWeeklyActivity(): Promise<{ day: string; messages: number }[]> {
    const weeklyActivity = await db
      .select({
        day: sql<string>`to_char(${messages.createdAt}, 'Day')`,
        messages: sql<number>`count(*)`
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '7 days'`)
      .groupBy(sql`to_char(${messages.createdAt}, 'Day'), extract(dow from ${messages.createdAt})`)
      .orderBy(sql`extract(dow from ${messages.createdAt})`);

    const dayMap: { [key: string]: string } = {
      'Sunday   ': 'Sun',
      'Monday   ': 'Mon', 
      'Tuesday  ': 'Tue',
      'Wednesday': 'Wed',
      'Thursday ': 'Thu',
      'Friday   ': 'Fri',
      'Saturday ': 'Sat'
    };

    const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityMap = new Map<string, number>();
    
    weeklyActivity.forEach(row => {
      const shortDay = dayMap[row.day] || row.day.trim().substring(0, 3);
      activityMap.set(shortDay, row.messages);
    });

    return allDays.map(day => ({
      day,
      messages: activityMap.get(day) || 0
    }));
  }

  // Message operations for WhatsApp Account 2
  async getMessages1(sessionId?: string): Promise<Message1[]> {
    if (sessionId) {
      return await db.select().from(messages1)
        .where(eq(messages1.sessionId, sessionId))
        .orderBy(asc(messages1.createdAt));
    }
    return await db.select().from(messages1).orderBy(desc(messages1.createdAt)).limit(100);
  }

  async getMessagesBySession1(sessionId: string): Promise<Message1[]> {
    return await db.select().from(messages1)
      .where(eq(messages1.sessionId, sessionId))
      .orderBy(asc(messages1.createdAt));
  }

  async createMessage1(message: InsertMessage1): Promise<Message1> {
    const [newMessage] = await db.insert(messages1).values(message).returning();
    return newMessage;
  }

  async getActiveSessions1(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]> {
    const result = await db
      .select({
        sessionId: messages1.sessionId,
        messageCount: sql<number>`count(*)`,
        lastActivity: sql<Date>`max(${messages1.createdAt})`,
      })
      .from(messages1)
      .groupBy(messages1.sessionId)
      .orderBy(sql`max(${messages1.createdAt}) desc`)
      .limit(10);
    
    return result;
  }

  async getMessageStats1(): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages1);

    const [weeklyResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '7 days'`);

    const [monthlyResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '30 days'`);

    const dailyMessages = await db
      .select({
        date: sql<string>`date_trunc('day', ${messages1.createdAt})::date`,
        count: sql<number>`count(*)`,
      })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '7 days'`)
      .groupBy(sql`date_trunc('day', ${messages1.createdAt})`)
      .orderBy(sql`date_trunc('day', ${messages1.createdAt})`);

    return {
      totalMessages: totalResult.count,
      dailyMessages,
      weeklyMessages: weeklyResult.count,
      monthlyMessages: monthlyResult.count,
    };
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(asc(students.name));
  }

  async getStudent(whatsappId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.whatsappId, whatsappId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(whatsappId: string, updates: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set(updates)
      .where(eq(students.whatsappId, whatsappId))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(whatsappId: string): Promise<void> {
    await db.delete(students).where(eq(students.whatsappId, whatsappId));
  }

  // Payment operations
  async getPayments(clientId?: string): Promise<Payment[]> {
    if (clientId) {
      return await db.select().from(payments)
        .where(eq(payments.clientId, clientId))
        .orderBy(desc(payments.year), desc(payments.month));
    }
    return await db.select().from(payments).orderBy(desc(payments.year), desc(payments.month));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, updates: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async getClientPaymentDue(clientId: string): Promise<{ totalDue: number; amountPaid: number; balance: number }> {
    const clientPayments = await db.select().from(payments).where(eq(payments.clientId, clientId));
    
    let totalDue = 0;
    let amountPaid = 0;
    
    clientPayments.forEach(p => {
      totalDue += parseFloat(p.totalDue);
      amountPaid += parseFloat(p.amountPaid);
    });
    
    return {
      totalDue,
      amountPaid,
      balance: totalDue - amountPaid
    };
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return newSetting;
    }
  }

  // Super admin analytics
  async getSuperAdminAnalytics(): Promise<{
    totalClients: number;
    totalMessages: number;
    totalStudents: number;
    totalRevenue: number;
    pendingPayments: number;
  }> {
    const [clientCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'client'));

    const [messageCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);

    const [studentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students);

    const revenueResult = await db.execute(
      sql`SELECT COALESCE(SUM(CAST(amount_paid AS DECIMAL)), 0) as total FROM payments`
    );

    const pendingResult = await db.execute(
      sql`SELECT COALESCE(SUM(CAST(total_due AS DECIMAL) - CAST(amount_paid AS DECIMAL)), 0) as pending FROM payments WHERE status != 'paid'`
    );

    return {
      totalClients: clientCount.count,
      totalMessages: messageCount.count,
      totalStudents: studentCount.count,
      totalRevenue: parseFloat((revenueResult.rows[0] as any)?.total || '0'),
      pendingPayments: parseFloat((pendingResult.rows[0] as any)?.pending || '0'),
    };
  }
}

export const storage = new DatabaseStorage();
