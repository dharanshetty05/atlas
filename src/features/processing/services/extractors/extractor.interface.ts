export interface ExtractedContent {
  text: string;
}

export interface DocumentExtractor {
  extract(buffer: Buffer): Promise<ExtractedContent>;
}
