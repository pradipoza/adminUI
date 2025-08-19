import { storage } from "../storage";
import { openaiService } from "./openaiService";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface ParsedDocument {
  title: string;
  filename: string;
  content: string;
}

export class DocumentService {
  async parseFile(file: Express.Multer.File): Promise<ParsedDocument> {
    const { originalname, buffer, mimetype } = file;
    let content = '';
    
    console.log(`Processing file: ${originalname}, type: ${mimetype}, size: ${buffer.length} bytes`);
    
    try {
      if (mimetype === 'application/pdf') {
        try {
          const pdfParse = require('pdf-parse');
          const data = await pdfParse(buffer);
          content = data.text;
          console.log(`Successfully parsed PDF, extracted ${content.length} characters`);
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          throw new Error(`PDF parsing failed: ${(pdfError as any).message}`);
        }
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          content = result.value;
          console.log(`Successfully parsed DOCX, extracted ${content.length} characters`);
        } catch (docxError) {
          console.error('DOCX parsing error:', docxError);
          throw new Error(`DOCX parsing failed: ${(docxError as any).message}`);
        }
      } else if (mimetype === 'text/plain') {
        content = buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${mimetype}`);
      }

      return {
        title: originalname.replace(/\.[^/.]+$/, ""), // Remove file extension
        filename: originalname,
        content: content.trim(),
      };
    } catch (error) {
      throw new Error(`Failed to parse file: ${(error as any).message}`);
    }
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk.trim());
      
      if (end >= text.length) break;
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  async processDocument(file: Express.Multer.File): Promise<{ documentId: number; chunkCount: number }> {
    // Parse the file
    const parsedDoc = await this.parseFile(file);
    
    // Create document in database
    const document = await storage.createDocument(parsedDoc);
    
    // Chunk the text
    const chunks = this.chunkText(parsedDoc.content);
    
    // Generate embeddings and store chunks
    let chunkCount = 0;
    for (const chunkText of chunks) {
      try {
        const embedding = await openaiService.createEmbedding(chunkText);
        await storage.createChunk({
          documentId: document.id,
          chunkText,
          embedding: `[${embedding.join(',')}]`, // Convert array to vector format
        });
        chunkCount++;
      } catch (error) {
        console.error(`Failed to process chunk: ${(error as any).message}`);
        // Continue processing other chunks
      }
    }

    return {
      documentId: document.id,
      chunkCount,
    };
  }

  async deleteDocument(id: number): Promise<void> {
    // First delete all chunks associated with the document
    await storage.deleteChunksByDocumentId(id);
    
    // Then delete the document
    await storage.deleteDocument(id);
  }
}

export const documentService = new DocumentService();
