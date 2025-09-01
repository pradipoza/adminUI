import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, getUserByEmail, updateUserPassword, updateUserProfile, comparePasswords } from "./auth";
import passport from "passport";
import { documentService } from "./services/documentService";
import { openaiService } from "./services/openaiService";
import multer from "multer";
import { insertDocumentSchema, insertMessageSchema, insertMessage1Schema, insertStudentSchema, loginSchema, updateProfileSchema } from "@shared/schema";

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

// Authentication middleware
function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Auth routes
  app.post('/api/auth/login', (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid email or password format" });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      
      req.logIn(user, (err: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login error", error: err.message });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });


  app.post('/api/auth/logout', (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.issues 
        });
      }

      const { email, password, currentPassword, firstName, lastName } = result.data;
      const userId = req.user.id;

      // If updating password, verify current password
      if (password && currentPassword) {
        const user = await storage.getUser(userId);
        if (!user || !(await comparePasswords(currentPassword, user.password))) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
        await updateUserPassword(userId, password);
      }

      // Update profile fields
      const updates: any = {};
      if (email && email !== req.user.email) {
        // Check if email is already taken
        const existingUser = await getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updates.email = email;
      }
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(userId, updates);
      }

      // Return updated user
      const updatedUser = await storage.getUser(userId);
      const { password: _, ...userWithoutPassword } = updatedUser!;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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

  // Message routes for WhatsApp Account 2
  app.get("/api/messages1", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      const messages = await storage.getMessages1(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages1:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages1/sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions1();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions1:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/messages1", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMessage1Schema.parse(req.body);
      const message = await storage.createMessage1(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message1:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      const range = req.query.range as string || '7days';
      const stats = await storage.getMessageStats(range);
      const sessions = await storage.getActiveSessions();
      const totalStudents = await storage.getTotalStudents();
      const weeklyActivity = await storage.getWeeklyActivity();
      
      res.json({
        ...stats,
        activeSessions: sessions.length,
        totalStudents,
        weeklyActivity,
        topSessions: sessions.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Student routes
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:whatsappId", isAuthenticated, async (req, res) => {
    try {
      const whatsappId = req.params.whatsappId;
      const student = await storage.getStudent(whatsappId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:whatsappId", isAuthenticated, async (req, res) => {
    try {
      const whatsappId = req.params.whatsappId;
      const updates = req.body;
      const student = await storage.updateStudent(whatsappId, updates);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:whatsappId", isAuthenticated, async (req, res) => {
    try {
      const whatsappId = req.params.whatsappId;
      await storage.deleteStudent(whatsappId);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Chat endpoint for testing AI responses
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and sessionId are required" });
      }

      // Use pgvector for efficient similarity search to find relevant context
      const relevantChunks = await openaiService.searchSimilarChunks(message, storage);
      const context = relevantChunks.join('\n\n');

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
