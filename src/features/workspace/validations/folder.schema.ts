import { MAX_ENTITY_NAME_LENGTH } from "@/constants/workspace";
import { z } from "zod";

export const createFolderSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  parentId: z.string().uuid("Invalid parent folder ID format").nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(MAX_ENTITY_NAME_LENGTH, `Folder name cannot exceed ${MAX_ENTITY_NAME_LENGTH} characters`),
});

export const renameFolderSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(MAX_ENTITY_NAME_LENGTH, `Folder name cannot exceed ${MAX_ENTITY_NAME_LENGTH} characters`),
});

export const moveFolderSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  newParentId: z.string().uuid("Invalid destination folder ID format").nullable(),
});

export const deleteFolderSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export const restoreFolderSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID format"),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type RenameFolderInput = z.infer<typeof renameFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type RestoreFolderInput = z.infer<typeof restoreFolderSchema>;
