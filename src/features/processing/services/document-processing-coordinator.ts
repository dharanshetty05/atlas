import { db } from "@/lib/db";
import { ProcessingJob } from "@prisma/client";
import { NonRetriableProcessingError } from "../errors/processing-errors";
import { processingService } from "./processing.service";
import { storageService } from "../../uploads/services/storage.service";
import { contentExtractionService } from "./content-extraction.service";
import { aiProcessingService } from "./ai/ai-processing.service";

import { knowledgePersistenceService } from "./knowledge-persistence.service";
import { DocumentKnowledge } from "@prisma/client";
import { activityService } from "../../activity/services/activity.service";

export class DocumentProcessingCoordinator {
  /**
   * Orchestrates the processing pipeline for a given job.
   * Responsibilities:
   * 1. Validate Document and Workspace existence.
   * 2. Fetch document buffer from StorageService.
   * 3. Extract content using ContentExtractionService.
   * 4. AI Processing via AIProcessingService.
   * 5. Persist AI extracted knowledge.
   * 6. Delegate lifecycle transitions back to ProcessingService.
   */
  async process(job: ProcessingJob): Promise<DocumentKnowledge | void> {
    try {
      // 1. Validation
      const document = await db.document.findUnique({
        where: { id: job.documentId },
        include: { workspace: true },
      });

      if (!document) {
        throw new NonRetriableProcessingError(`Document ${job.documentId} not found.`);
      }

      if (document.deletedAt !== null) {
        throw new NonRetriableProcessingError(`Document ${job.documentId} has been soft-deleted.`);
      }

      if (!document.workspace) {
        throw new NonRetriableProcessingError(`Workspace for document ${job.documentId} is invalid or missing.`);
      }

      // 2. Fetch file buffer
      const buffer = await storageService.getObjectBuffer(document.storageKey);

      // 3. Extract content
      const extractedContent = await contentExtractionService.extract(
        buffer,
        document.mimeType,
        document.originalFilename
      );

      // 4. AI Processing
      const aiResult = await aiProcessingService.process({
        extractedContent,
        documentId: job.documentId
      });

      // 5. Persist Knowledge
      const persistedKnowledge = await knowledgePersistenceService.persistKnowledge(job.documentId, aiResult);

      // 6. Mark completed
      await processingService.completeJob(job.id);
      await db.document.update({
        where: { id: job.documentId },
        data: { status: "READY" }
      });
      
      await activityService.logActivity({
        userId: document.ownerId,
        type: "AI_COMPLETION",
        documentId: document.id,
        entityName: document.title,
      });

      return persistedKnowledge;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetriable = !(error instanceof NonRetriableProcessingError);

      // Use standard error handling/reporting here.
      // Console.error is avoided as requested. A real logger could be injected.

      await processingService.failJob(job.id, errorMessage, isRetriable);
      await db.document.update({
        where: { id: job.documentId },
        data: { status: "FAILED" }
      });
    }
  }
}

export const documentProcessingCoordinator = new DocumentProcessingCoordinator();
