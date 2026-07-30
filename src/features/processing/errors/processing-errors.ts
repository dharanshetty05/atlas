export class ProcessingError extends Error {
  public code: string;

  constructor(message: string, code: string = "PROCESSING_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class JobNotFoundError extends ProcessingError {
  constructor(jobId: string) {
    super(`Job with ID ${jobId} not found`, "JOB_NOT_FOUND");
  }
}

export class NonRetriableProcessingError extends ProcessingError {
  constructor(message: string) {
    super(message, "NON_RETRIABLE_ERROR");
  }
}

export class InvalidJobStateTransitionError extends ProcessingError {
  constructor(jobId: string, fromState: string, toState: string) {
    super(
      `Cannot transition job ${jobId} from ${fromState} to ${toState}`,
      "INVALID_JOB_STATE_TRANSITION"
    );
  }
}
