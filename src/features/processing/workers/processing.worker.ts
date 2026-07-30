import { processingService } from "../services/processing.service";
import { documentProcessingCoordinator } from "../services/document-processing-coordinator";

/**
 * Worker entry point to process background jobs.
 * This function can be called continuously or periodically by an external trigger.
 * It will process jobs one by one until no pending jobs remain.
 */
export async function processPendingJobs(): Promise<void> {
  // Loop continuously until there are no more pending jobs to claim.
  while (true) {
    // 1. Atomically claim the next pending job.
    const claimedJob = await processingService.claimNextPendingJob();

    // 2. If no job is returned, exit the loop.
    if (!claimedJob) {
      break;
    }

    // 3. Delegate the job execution to the coordinator.
    // We await this so jobs are processed sequentially by this worker.
    // Concurrency is achieved by running multiple workers.
    await documentProcessingCoordinator.process(claimedJob);
  }
}
