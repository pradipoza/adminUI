import {
  users,
  documents,
  chunks,
  messages,
  messages1,
  students,
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
  getCombinedMessageStats(timeRange?: string): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }>;
  getWeeklyActivity(): Promise<{ day: string; messages: number }[]>;
  getCombinedWeeklyActivity(): Promise<{ day: string; messages: number }[]>;
  getTotalStudents(): Promise<number>;
  getCombinedActiveSessions(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]>;
  
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
    // Use pgvector's cosine distance operator for efficient similarity search
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
    // Map time ranges to SQL intervals
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

    // Map full day names to short forms and ensure all days are represented
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
    
    // Fill in the actual data
    weeklyActivity.forEach(row => {
      const shortDay = dayMap[row.day] || row.day.trim().substring(0, 3);
      activityMap.set(shortDay, row.messages);
    });

    // Return all days with 0 for missing days
    return allDays.map(day => ({
      day,
      messages: activityMap.get(day) || 0
    }));
  }

  async getCombinedMessageStats(timeRange: string = '7days'): Promise<{
    totalMessages: number;
    dailyMessages: { date: string; count: number }[];
    weeklyMessages: number;
    monthlyMessages: number;
  }> {
    // Map time ranges to SQL intervals
    const intervalMap: { [key: string]: string } = {
      '1day': '1 day',
      '7days': '7 days', 
      '30days': '30 days',
      '6months': '6 months',
      '1year': '1 year'
    };
    
    const interval = intervalMap[timeRange] || '7 days';
    
    // Get total messages from both tables
    const [totalResult1] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '${sql.raw(interval)}'`);
      
    const [totalResult2] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '${sql.raw(interval)}'`);

    // Get weekly messages from both tables
    const [weeklyResult1] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '7 days'`);
      
    const [weeklyResult2] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '7 days'`);

    // Get monthly messages from both tables
    const [monthlyResult1] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '30 days'`);
      
    const [monthlyResult2] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '30 days'`);

    // Get daily messages from both tables
    const dailyMessages1 = await db
      .select({
        date: sql<string>`date_trunc('day', ${messages.createdAt})::date`,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '${sql.raw(interval)}'`)
      .groupBy(sql`date_trunc('day', ${messages.createdAt})`)
      .orderBy(sql`date_trunc('day', ${messages.createdAt})`);
      
    const dailyMessages2 = await db
      .select({
        date: sql<string>`date_trunc('day', ${messages1.createdAt})::date`,
        count: sql<number>`count(*)`,
      })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '${sql.raw(interval)}'`)
      .groupBy(sql`date_trunc('day', ${messages1.createdAt})`)
      .orderBy(sql`date_trunc('day', ${messages1.createdAt})`);

    // Combine daily messages
    const dailyMap = new Map<string, number>();
    
    dailyMessages1.forEach(row => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.count);
    });
    
    dailyMessages2.forEach(row => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.count);
    });
    
    const combinedDailyMessages = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalMessages: totalResult1.count + totalResult2.count,
      dailyMessages: combinedDailyMessages,
      weeklyMessages: weeklyResult1.count + weeklyResult2.count,
      monthlyMessages: monthlyResult1.count + monthlyResult2.count,
    };
  }

  async getCombinedWeeklyActivity(): Promise<{ day: string; messages: number }[]> {
    // Get weekly activity from both tables
    const weeklyActivity1 = await db
      .select({
        day: sql<string>`to_char(${messages.createdAt}, 'Day')`,
        messages: sql<number>`count(*)`
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= current_date - interval '7 days'`)
      .groupBy(sql`to_char(${messages.createdAt}, 'Day'), extract(dow from ${messages.createdAt})`)
      .orderBy(sql`extract(dow from ${messages.createdAt})`);
      
    const weeklyActivity2 = await db
      .select({
        day: sql<string>`to_char(${messages1.createdAt}, 'Day')`,
        messages: sql<number>`count(*)`
      })
      .from(messages1)
      .where(sql`${messages1.createdAt} >= current_date - interval '7 days'`)
      .groupBy(sql`to_char(${messages1.createdAt}, 'Day'), extract(dow from ${messages1.createdAt})`)
      .orderBy(sql`extract(dow from ${messages1.createdAt})`);

    // Map full day names to short forms and ensure all days are represented
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
    
    // Fill in the actual data from both tables
    weeklyActivity1.forEach(row => {
      const shortDay = dayMap[row.day] || row.day.trim().substring(0, 3);
      activityMap.set(shortDay, (activityMap.get(shortDay) || 0) + row.messages);
    });
    
    weeklyActivity2.forEach(row => {
      const shortDay = dayMap[row.day] || row.day.trim().substring(0, 3);
      activityMap.set(shortDay, (activityMap.get(shortDay) || 0) + row.messages);
    });

    // Return all days with 0 for missing days
    return allDays.map(day => ({
      day,
      messages: activityMap.get(day) || 0
    }));
  }

  async getCombinedActiveSessions(): Promise<{ sessionId: string; messageCount: number; lastActivity: Date }[]> {
    const sessions1 = await this.getActiveSessions();
    const sessions2 = await this.getActiveSessions1();
    
    return [...sessions1, ...sessions2];
  }

  // Message operations for WhatsApp Account 2 (messages1)
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
}

export const storage = new DatabaseStorage();
