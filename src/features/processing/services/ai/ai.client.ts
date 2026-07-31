import Groq from "groq-sdk";
import { AIServiceUnavailableError } from "../../errors/ai-errors";
import { AI_CONFIG } from "./ai.config";

export class AIClient {
  private client: Groq | null = null;

  private getClient(): Groq {
    if (!this.client) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new AIServiceUnavailableError("GROQ_API_KEY is not configured.");
      }
      this.client = new Groq({ apiKey });
    }
    return this.client;
  }

  /**
   * Generates a structured response from the AI provider.
   * Isolates provider-specific logic and configuration.
   */
  async generateStructuredResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    const groq = this.getClient();

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: AI_CONFIG.MODEL,
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new AIServiceUnavailableError("AI Provider returned an empty response.");
      }

      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIServiceUnavailableError(`AI Provider communication failed: ${errorMessage}`);
    }
  }
}

export const aiClient = new AIClient();
