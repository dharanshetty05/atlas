import { AIProcessingRequest, AIProcessingResult } from "./contracts";
import { AIValidationError } from "../../errors/ai-errors";
import { aiClient } from "./ai.client";
import { AIResponseParser } from "./ai-response-parser";
import { documentAnalysisPrompt } from "./prompts/document-analysis";
import { AI_CONFIG } from "./ai.config";
import { aiLogger } from "./ai.logger";

export class AIProcessingService {

  /**
   * Orchestrates the extraction of structured knowledge from raw text.
   */
  async process(request: AIProcessingRequest): Promise<AIProcessingResult> {
    const startTime = Date.now();
    const { extractedContent, documentId } = request;
    
    try {
      // 1. Validate Input
      if (!extractedContent.text || extractedContent.text.trim().length === 0) {
        throw new AIValidationError("Extracted content is empty or contains only whitespace.");
      }

      // 2. Truncate if necessary (protect the model)
      let textToProcess = extractedContent.text;
      if (textToProcess.length > AI_CONFIG.MAX_INPUT_LENGTH) {
        textToProcess = textToProcess.slice(0, AI_CONFIG.MAX_INPUT_LENGTH);
      }

      // 3. Build Prompt
      const systemPrompt = documentAnalysisPrompt.system;
      const userPrompt = documentAnalysisPrompt.buildUserMessage(textToProcess);

      // 4. Call AI Client
      // We explicitly log timing but NOT document content or raw response
      const rawResponse = await aiClient.generateStructuredResponse(systemPrompt, userPrompt);

      // 5. Parse and Validate
      const result = AIResponseParser.parse(rawResponse);

      // Log success
      this.logProcessing(documentId, startTime, true);

      return result;
    } catch (error) {
      // Log failure
      this.logProcessing(documentId, startTime, false, error);
      throw error;
    }
  }

  private logProcessing(documentId: string, startTime: number, success: boolean, error?: unknown) {
    const finishTime = Date.now();
    const duration = finishTime - startTime;
    
    const metadata = {
      documentId,
      startTime,
      finishTime,
      durationMs: duration,
      success,
      ...(error instanceof Error ? { error: error.message } : {})
    };

    if (success) {
      aiLogger.info("ai_processing_completed", metadata);
    } else {
      aiLogger.error("ai_processing_failed", metadata);
    }
  }
}

export const aiProcessingService = new AIProcessingService();
