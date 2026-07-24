"use server";

import { requireAuth } from "@/lib/auth/server";
import { DomainError } from "@/features/workspace/errors/workspace-errors";
import { documentService } from "@/features/workspace/services/document.service";
import { uploadDocumentSchema } from "@/features/documents/validations/upload.schema";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";

/**
 * Uploads a document to the server and creates its metadata record.
 */
export async function uploadDocumentAction(formData: FormData): Promise<ActionState<any>> {
  const folderIdRaw = formData.get("folderId") as string | null;
  const fileRaw = formData.get("file");

  if (!fileRaw || !(fileRaw instanceof File)) {
    return {
      success: false,
      error: "Validation failed. Please provide a valid file.",
    };
  }

  // folderId can be empty string or null, normalize it
  const normalizedFolderId = folderIdRaw && folderIdRaw.trim() !== "" ? folderIdRaw : null;

  const validation = uploadDocumentSchema.safeParse({ folderId: normalizedFolderId });
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Invalid folder destination.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const doc = await documentService.upload(user.id, fileRaw, validation.data.folderId);

    revalidatePath(validation.data.folderId ? `/dashboard/folders/${validation.data.folderId}` : "/dashboard");
    
    return { success: true, data: doc };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while uploading the document." };
  }
}
