import { aiProcessingResultSchema } from "./schemas/ai-processing-result.schema";
import { AIProcessingResult } from "./contracts";
import { AIValidationError } from "../../errors/ai-errors";

export class AIResponseParser {
  /**
   * Parses the raw AI response string as JSON and validates it against the Zod schema.
   * Throws AIValidationError on parsing or validation failures.
   */
  static parse(rawResponse: string): AIProcessingResult {
    let parsed: unknown;

    try {
      // Basic cleanup in case the model ignored instructions and wrapped in markdown
      const cleanedResponse = rawResponse
        .replace(/^```json\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
        
      parsed = JSON.parse(cleanedResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIValidationError(`Failed to parse AI response as JSON: ${errorMessage}. Raw response was preserved for debugging.`);
    }

    const validationResult = aiProcessingResultSchema.safeParse(parsed);

    if (!validationResult.success) {
      throw new AIValidationError(`AI response failed schema validation: ${validationResult.error.message}`);
    }

    return validationResult.data as AIProcessingResult;
  }
}
