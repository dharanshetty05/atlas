import { DocumentExtractor, ExtractedContent } from "./extractor.interface";
import { CorruptDocumentError } from "../../errors/extraction-errors";
import pdfParse from "pdf-parse";

export class PdfExtractor implements DocumentExtractor {
  async extract(buffer: Buffer): Promise<ExtractedContent> {
    if (buffer.length === 0) {
      return { text: "" };
    }
    try {
      const data = await pdfParse(buffer);
      return { text: data.text };
    } catch (error) {
      throw new CorruptDocumentError(`Failed to parse PDF document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
