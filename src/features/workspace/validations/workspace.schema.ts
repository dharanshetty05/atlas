import { MAX_ENTITY_NAME_LENGTH } from "@/constants/workspace";
import { z } from "zod";

export const renameWorkspaceSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID format"),
  name: z
    .string()
    .trim()
    .min(1, "Workspace name cannot be empty")
    .max(MAX_ENTITY_NAME_LENGTH, `Workspace name cannot exceed ${MAX_ENTITY_NAME_LENGTH} characters`),
});

export type RenameWorkspaceInput = z.infer<typeof renameWorkspaceSchema>;
