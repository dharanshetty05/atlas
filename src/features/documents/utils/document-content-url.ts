export type DocumentContentDisposition = "inline" | "attachment";

/**
 * Builds the authorized document content URL served by the content API route.
 * The client only supplies the document ID; storage keys are resolved server-side.
 */
export function buildDocumentContentUrl(
  documentId: string,
  disposition: DocumentContentDisposition = "inline"
): string {
  if (disposition === "attachment") {
    return `/api/documents/${documentId}/content?disposition=attachment`;
  }

  return `/api/documents/${documentId}/content`;
}
