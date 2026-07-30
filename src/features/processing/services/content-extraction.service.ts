import { DocumentExtractor, ExtractedContent } from "./extractors/extractor.interface";
import { PdfExtractor } from "./extractors/pdf.extractor";
import { DocxExtractor } from "./extractors/docx.extractor";
import { TxtExtractor } from "./extractors/txt.extractor";
import { MarkdownExtractor } from "./extractors/markdown.extractor";
import { UnsupportedDocumentTypeError } from "../errors/extraction-errors";

export class ContentExtractionService {
  private mimeTypeRegistry = new Map<string, DocumentExtractor>();
  private extensionRegistry = new Map<string, DocumentExtractor>();

  constructor() {
    this.registerExtractors();
  }

  private registerExtractors() {
    const pdfExtractor = new PdfExtractor();
    const docxExtractor = new DocxExtractor();
    const txtExtractor = new TxtExtractor();
    const markdownExtractor = new MarkdownExtractor();

    // Register by MIME type
    this.mimeTypeRegistry.set("application/pdf", pdfExtractor);
    this.mimeTypeRegistry.set("application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxExtractor);
    this.mimeTypeRegistry.set("text/plain", txtExtractor);
    this.mimeTypeRegistry.set("text/markdown", markdownExtractor);

    // Register by extension as fallback
    this.extensionRegistry.set(".pdf", pdfExtractor);
    this.extensionRegistry.set(".docx", docxExtractor);
    this.extensionRegistry.set(".txt", txtExtractor);
    this.extensionRegistry.set(".md", markdownExtractor);
    this.extensionRegistry.set(".markdown", markdownExtractor);
  }

  private getExtractor(mimeType: string, filename: string): DocumentExtractor {
    // 1. Primary mechanism: MIME type
    const normalizedMime = mimeType.toLowerCase().trim();
    if (this.mimeTypeRegistry.has(normalizedMime)) {
      return this.mimeTypeRegistry.get(normalizedMime)!;
    }

    // 2. Fallback: Filename extension
    const extension = this.getExtension(filename);
    if (extension && this.extensionRegistry.has(extension)) {
      return this.extensionRegistry.get(extension)!;
    }

    throw new UnsupportedDocumentTypeError(mimeType || extension || "unknown");
  }

  private getExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return "";
    }
    return filename.substring(lastDotIndex).toLowerCase();
  }

  async extract(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractedContent> {
    const extractor = this.getExtractor(mimeType, filename);
    return await extractor.extract(buffer);
  }
}

export const contentExtractionService = new ContentExtractionService();
