import { z } from "zod";

export const uploadDocumentSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID format").nullable().optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
