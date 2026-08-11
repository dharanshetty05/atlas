"use server";

import { requireAuth } from "@/lib/auth/server";
import { DomainError } from "@/features/workspace/errors/workspace-errors";
import { documentService } from "@/features/workspace/services/document.service";
import {
  createDocumentRecordSchema,
  deleteDocumentSchema,
  moveDocumentSchema,
  renameDocumentSchema,
  restoreDocumentSchema,
  searchDocumentsSchema,
  type CreateDocumentRecordInput,
  type DeleteDocumentInput,
  type MoveDocumentInput,
  type RenameDocumentInput,
  type RestoreDocumentInput,
  type SearchDocumentsInput,
} from "@/features/workspace/validations/document.schema";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";
import type { SearchResult } from "@/features/workspace/types";
import { activityService } from "@/features/activity/services/activity.service";

/**
 * Creates a new document metadata record within a workspace or folder.
 */
export async function createDocumentRecordAction(input: CreateDocumentRecordInput): Promise<ActionState<any>> {
  const validation = createDocumentRecordSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please verify document title and file metadata.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const doc = await documentService.createDocumentRecord(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: doc };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while creating the document record." };
  }
}

/**
 * Renames a document (`Last Write Wins`).
 */
export async function renameDocumentAction(input: RenameDocumentInput): Promise<ActionState<any>> {
  const validation = renameDocumentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please provide a valid title.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const doc = await documentService.renameDocument(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    
    await activityService.logActivity({
      userId: user.id,
      type: "UPDATE",
      documentId: doc.id,
      entityName: doc.title,
    });

    return { success: true, data: doc };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while renaming the document." };
  }
}

/**
 * Moves a document to another folder or workspace root.
 */
export async function moveDocumentAction(input: MoveDocumentInput): Promise<ActionState<any>> {
  const validation = moveDocumentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Invalid folder destination.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const doc = await documentService.moveDocument(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: doc };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while moving the document." };
  }
}

/**
 * Soft-deletes a document (`deletedAt = now()`).
 */
export async function deleteDocumentAction(input: DeleteDocumentInput): Promise<ActionState<undefined>> {
  const validation = deleteDocumentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    
    // Fetch document before deletion to capture its name for the activity log
    const doc = await documentService.getDocumentById(validation.data.workspaceId, validation.data.documentId);
    
    await documentService.deleteDocument(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    
    await activityService.logActivity({
      userId: user.id,
      type: "DELETE",
      documentId: validation.data.documentId,
      entityName: doc.title,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while deleting the document." };
  }
}

/**
 * Restores a soft-deleted document (`deletedAt = null`).
 */
export async function restoreDocumentAction(input: RestoreDocumentInput): Promise<ActionState<undefined>> {
  const validation = restoreDocumentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    await documentService.restoreDocument(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    
    // Fetch document after restoration to capture its name
    const doc = await documentService.getDocumentById(validation.data.workspaceId, validation.data.documentId);
    
    await activityService.logActivity({
      userId: user.id,
      type: "RESTORE",
      documentId: validation.data.documentId,
      entityName: doc.title,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while restoring the document." };
  }
}

/**
 * Searches for documents by title or original filename within a workspace.
 */
export async function searchDocumentsAction(input: SearchDocumentsInput): Promise<ActionState<SearchResult[]>> {
  const validation = searchDocumentsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid search query.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const { workspaceId, query } = validation.data;
    const results = await documentService.searchDocuments(workspaceId, query, user.id);

    if (query.trim().length >= 2) {
      await activityService.logActivity({
        userId: user.id,
        type: "SEARCH",
        entityName: "Search",
        metadata: {
          query: query.trim(),
          resultCount: results.length,
        },
      });
    }

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Failed to search documents:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred while searching documents." };
  }
}
