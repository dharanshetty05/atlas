import { MAX_ENTITY_NAME_LENGTH } from "@/constants/workspace";
import { z } from "zod";

export const createDocumentRecordSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  folderId: z.string().uuid("Invalid folder ID format").nullable().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Document title is required")
    .max(MAX_ENTITY_NAME_LENGTH, `Document title cannot exceed ${MAX_ENTITY_NAME_LENGTH} characters`),
  originalFilename: z.string().min(1, "Original filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.union([z.number(), z.bigint()]).transform((val) => BigInt(val)),
  storageKey: z.string().min(1, "Storage key is required"),
});

export const renameDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  title: z
    .string()
    .trim()
    .min(1, "Document title is required")
    .max(MAX_ENTITY_NAME_LENGTH, `Document title cannot exceed ${MAX_ENTITY_NAME_LENGTH} characters`),
});

export const moveDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  newFolderId: z.string().uuid("Invalid destination folder ID format").nullable(),
});

export const deleteDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export const restoreDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export type CreateDocumentRecordInput = z.infer<typeof createDocumentRecordSchema>;
export type RenameDocumentInput = z.infer<typeof renameDocumentSchema>;
export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
export type RestoreDocumentInput = z.infer<typeof restoreDocumentSchema>;

export const searchDocumentsSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  query: z.string().trim().max(100, "Search query cannot exceed 100 characters"),
});

export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
