import { ExtractedContent } from "../extractors/extractor.interface";

export interface AIProcessingRequest {
  extractedContent: ExtractedContent;
  documentId: string;
}

export interface AIProcessingResult {
  version: 1;
  summary: string;
  keywords: string[];
}
