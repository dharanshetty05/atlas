import { NonRetriableProcessingError, ProcessingError } from "./processing-errors";

export class ExtractionError extends ProcessingError {
  constructor(message: string) {
    super(message, "EXTRACTION_ERROR");
  }
}

export class UnsupportedDocumentTypeError extends NonRetriableProcessingError {
  constructor(mimeType: string) {
    super(`Unsupported document type: ${mimeType}`);
    this.code = "UNSUPPORTED_DOCUMENT_TYPE";
  }
}

export class CorruptDocumentError extends NonRetriableProcessingError {
  constructor(message: string = "Document is corrupt or unreadable") {
    super(message);
    this.code = "CORRUPT_DOCUMENT_ERROR";
  }
}
