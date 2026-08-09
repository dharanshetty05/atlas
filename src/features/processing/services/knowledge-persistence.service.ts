import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { KnowledgePersistenceError } from "../errors/persistence-errors";
import { AIProcessingResult } from "./ai/contracts";
import { AI_CONFIG } from "./ai/ai.config";
import { DOCUMENT_ANALYSIS_PROMPT_VERSION } from "./ai/prompts/document-analysis";

export class KnowledgePersistenceService {
  /**
   * Persists AI extracted knowledge to the database.
   * Explicitly maps the AI contract into the persistence model.
   *
   * @param documentId The ID of the document.
   * @param aiResult The validated AI processing result.
   * @returns The persisted DocumentKnowledge entity.
   * @throws {KnowledgePersistenceError} if a database error occurs.
   */
  async persistKnowledge(documentId: string, aiResult: AIProcessingResult) {
    try {
      // Extract prompt major version from semver string (e.g. "1.0.0" -> 1)
      const promptMajorVersion = parseInt(DOCUMENT_ANALYSIS_PROMPT_VERSION.split(".")[0], 10) || 1;

      return await db.documentKnowledge.upsert({
        where: { documentId },
        update: {
          schemaVersion: aiResult.version,
          promptVersion: promptMajorVersion,
          summary: aiResult.summary,
          keywords: aiResult.keywords,
          modelName: AI_CONFIG.MODEL,
          processedAt: new Date(),
        },
        create: {
          documentId,
          schemaVersion: aiResult.version,
          promptVersion: promptMajorVersion,
          summary: aiResult.summary,
          keywords: aiResult.keywords,
          modelName: AI_CONFIG.MODEL,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      const isPrismaError = error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientUnknownRequestError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientValidationError;

      if (isPrismaError) {
        const message = error instanceof Error ? error.message : "Unknown database error";
        throw new KnowledgePersistenceError(
          `Failed to persist knowledge for document ${documentId}: ${message}`,
          error
        );
      }

      throw error;
    }
  }
}

export const knowledgePersistenceService = new KnowledgePersistenceService();
