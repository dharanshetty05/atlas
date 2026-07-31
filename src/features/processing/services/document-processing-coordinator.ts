import { db } from "@/lib/db";
import { ProcessingJob } from "@prisma/client";
import { NonRetriableProcessingError, ProcessingError } from "../errors/processing-errors";
import { processingService } from "./processing.service";
import { storageService } from "../../uploads/services/storage.service";
import { contentExtractionService } from "./content-extraction.service";
import { aiProcessingService } from "./ai/ai-processing.service";
import { AIProcessingResult } from "./ai/contracts";

export class DocumentProcessingCoordinator {
  /**
   * Orchestrates the processing pipeline for a given job.
   * Responsibilities:
   * 1. Validate Document and Workspace existence.
   * 2. Fetch document buffer from StorageService.
   * 3. Extract content using ContentExtractionService.
   * 4. AI Processing via AIProcessingService.
   * 5. Delegate lifecycle transitions back to ProcessingService.
   */
  async process(job: ProcessingJob): Promise<AIProcessingResult | void> {
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

      // Note: We do not persist `aiResult` beyond this point 
      // in Module 3, as requested. This proves the pipeline works.
      // We return it through the orchestration flow to prepare for Module 4.

      // 5. Mark completed
      await processingService.completeJob(job.id);
      
      return aiResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetriable = !(error instanceof NonRetriableProcessingError);

      // Use standard error handling/reporting here.
      // Console.error is avoided as requested. A real logger could be injected.

      await processingService.failJob(job.id, errorMessage, isRetriable);
    }
  }
}

export const documentProcessingCoordinator = new DocumentProcessingCoordinator();
