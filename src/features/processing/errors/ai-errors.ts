export class AIProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProcessingError";
  }
}

export class AIValidationError extends AIProcessingError {
  constructor(message: string) {
    super(message);
    this.name = "AIValidationError";
  }
}

export class AIServiceUnavailableError extends AIProcessingError {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceUnavailableError";
  }
}
