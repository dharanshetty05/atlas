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
  type CreateDocumentRecordInput,
  type DeleteDocumentInput,
  type MoveDocumentInput,
  type RenameDocumentInput,
  type RestoreDocumentInput,
} from "@/features/workspace/validations/document.schema";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";

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

    revalidatePath("/dashboard");
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

    revalidatePath("/dashboard");
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

    revalidatePath("/dashboard");
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
    await documentService.deleteDocument(validation.data, user.id);

    revalidatePath("/dashboard");
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

    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while restoring the document." };
  }
}
