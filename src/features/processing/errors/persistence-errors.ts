import { ProcessingError } from "./processing-errors";

export class KnowledgePersistenceError extends ProcessingError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, "KNOWLEDGE_PERSISTENCE_ERROR");
  }
}
