import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-default",
});

export class OpenAIService {
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to create embedding: ${(error as any).message}`);
    }
  }

  async generateChatResponse(messages: any[], systemPrompt?: string): Promise<string> {
    try {
      const chatMessages: any[] = [];
      
      if (systemPrompt) {
        chatMessages.push({ role: "system", content: systemPrompt });
      }
      
      chatMessages.push(...messages);

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: chatMessages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      throw new Error(`Failed to generate chat response: ${(error as any).message}`);
    }
  }

  async searchSimilarChunks(query: string, storage: any): Promise<string[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.createEmbedding(query);
      
      // Use pgvector for efficient similarity search
      const results = await storage.searchSimilarChunks(queryEmbedding, 3);
      return results.map((result: any) => result.chunkText);
    } catch (error) {
      console.error('Failed to search similar chunks:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

export const openaiService = new OpenAIService();
