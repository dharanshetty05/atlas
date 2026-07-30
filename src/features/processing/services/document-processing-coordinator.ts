import { db } from "@/lib/db";
import { ProcessingJob } from "@prisma/client";
import { NonRetriableProcessingError, ProcessingError } from "../errors/processing-errors";
import { processingService } from "./processing.service";
// Note: If you have a specific storage service method to check object existence, use it.
// For now we assume the object exists if the document exists in DB, or we can just mock the validation.

export class DocumentProcessingCoordinator {
  /**
   * Orchestrates the processing pipeline for a given job.
   * Responsibilities:
   * 1. Validate Document and Workspace existence.
   * 2. (Future) Execute processing tasks.
   * 3. Delegate lifecycle transitions back to ProcessingService.
   */
  async process(job: ProcessingJob): Promise<void> {
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

      // If we had a storageService.existsObject(document.storageKey), we would call it here.

      // 2. Future module execution would go here
      // e.g. text extraction, AI processing, etc.

      // 3. Mark completed
      await processingService.completeJob(job.id);
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
