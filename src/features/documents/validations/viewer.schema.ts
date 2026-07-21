import { z } from "zod";

export const getDocumentViewerPayloadSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export const getDownloadUrlSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export type GetDocumentViewerPayloadInput = z.infer<typeof getDocumentViewerPayloadSchema>;
export type GetDownloadUrlInput = z.infer<typeof getDownloadUrlSchema>;
