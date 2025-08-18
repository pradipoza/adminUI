import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { documentService } from "./services/documentService";
import { openaiService } from "./services/openaiService";
import multer from "multer";
import { insertDocumentSchema, insertMessageSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      
      // Get chunk counts for each document
      const documentsWithChunks = await Promise.all(
        documents.map(async (doc) => {
          const chunks = await storage.getChunksByDocumentId(doc.id);
          return {
            ...doc,
            chunkCount: chunks.length,
          };
        })
      );
      
      res.json(documentsWithChunks);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const chunks = await storage.getChunksByDocumentId(id);
      res.json({ ...document, chunks });
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await documentService.processDocument(req.file);
      res.json({
        message: "Document uploaded and processed successfully",
        documentId: result.documentId,
        chunkCount: result.chunkCount,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: (error as any).message || "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await documentService.deleteDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Message routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      const messages = await storage.getMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      const range = req.query.range as string || 'weekly';
      const stats = await storage.getMessageStats();
      const sessions = await storage.getActiveSessions();
      
      res.json({
        ...stats,
        activeSessions: sessions.length,
        topSessions: sessions.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Chat endpoint for testing AI responses
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and sessionId are required" });
      }

      // Get all chunks for context (simplified - in production you'd want similarity search)
      const documents = await storage.getDocuments();
      let context = '';
      
      for (const doc of documents.slice(0, 3)) { // Limit to first 3 docs for context
        const chunks = await storage.getChunksByDocumentId(doc.id);
        context += chunks.map(c => c.chunkText).join('\n') + '\n';
      }

      const systemPrompt = `You are a helpful customer service assistant. Use the following context to answer questions when relevant:\n\n${context}`;
      
      const response = await openaiService.generateChatResponse(
        [{ role: "user", content: message }],
        systemPrompt
      );

      // Store both user message and AI response
      await storage.createMessage({
        sessionId,
        message: { type: "user", content: message, timestamp: new Date() },
      });

      await storage.createMessage({
        sessionId,
        message: { type: "assistant", content: response, timestamp: new Date() },
      });

      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
