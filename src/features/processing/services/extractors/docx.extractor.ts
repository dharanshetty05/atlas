import { DocumentExtractor, ExtractedContent } from "./extractor.interface";
import { CorruptDocumentError } from "../../errors/extraction-errors";
import mammoth from "mammoth";

export class DocxExtractor implements DocumentExtractor {
  async extract(buffer: Buffer): Promise<ExtractedContent> {
    if (buffer.length === 0) {
      return { text: "" };
    }
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    } catch (error) {
      throw new CorruptDocumentError(`Failed to parse DOCX document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
