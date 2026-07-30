import { DocumentExtractor, ExtractedContent } from "./extractor.interface";

export class TxtExtractor implements DocumentExtractor {
  async extract(buffer: Buffer): Promise<ExtractedContent> {
    if (buffer.length === 0) {
      return { text: "" };
    }
    const text = buffer.toString("utf-8");
    return { text };
  }
}
