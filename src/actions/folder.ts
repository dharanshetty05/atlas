"use server";

import { requireAuth } from "@/lib/auth/server";
import { DomainError } from "@/features/workspace/errors/workspace-errors";
import { folderService } from "@/features/workspace/services/folder.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import {
  createFolderSchema,
  deleteFolderSchema,
  moveFolderSchema,
  renameFolderSchema,
  restoreFolderSchema,
  type CreateFolderInput,
  type DeleteFolderInput,
  type MoveFolderInput,
  type RenameFolderInput,
  type RestoreFolderInput,
} from "@/features/workspace/validations/folder.schema";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";

/**
 * Lists immediate child folders and documents inside a specific parent folder (or workspace root).
 */
export async function listDirectChildrenAction(
  workspaceId?: string,
  parentId: string | null = null
): Promise<ActionState<any>> {
  try {
    const { user } = await requireAuth();
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const personal = await workspaceService.getOrCreatePersonalWorkspace(user.id);
      targetWorkspaceId = personal.id;
    } else {
      await workspaceService.verifyWorkspaceAccess(user.id, targetWorkspaceId);
    }

    const contents = await folderService.listDirectChildren(targetWorkspaceId, parentId);
    return { success: true, data: contents };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while loading folder contents." };
  }
}

/**
 * Creates a new folder inside a workspace or parent folder.
 */
export async function createFolderAction(input: CreateFolderInput): Promise<ActionState<any>> {
  const validation = createFolderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please verify folder name and parent destination.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const folder = await folderService.createFolder(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: folder };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while creating the folder." };
  }
}

/**
 * Renames an existing folder.
 */
export async function renameFolderAction(input: RenameFolderInput): Promise<ActionState<any>> {
  const validation = renameFolderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please provide a valid folder name.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const folder = await folderService.renameFolder(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: folder };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while renaming the folder." };
  }
}

/**
 * Moves a folder to a new parent destination after verifying circular reference prevention and depth invariants.
 */
export async function moveFolderAction(input: MoveFolderInput): Promise<ActionState<any>> {
  const validation = moveFolderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Invalid destination selected.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const folder = await folderService.moveFolder(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: folder };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while moving the folder." };
  }
}

/**
 * Atomically soft-deletes a folder subtree (`deletedAt = now()`).
 */
export async function deleteFolderAction(input: DeleteFolderInput): Promise<ActionState<undefined>> {
  const validation = deleteFolderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    await folderService.deleteFolder(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while deleting the folder." };
  }
}

/**
 * Atomically restores a soft-deleted folder subtree using exact-timestamp matching.
 */
export async function restoreFolderAction(input: RestoreFolderInput): Promise<ActionState<undefined>> {
  const validation = restoreFolderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    await folderService.restoreFolder(validation.data, user.id);

    revalidatePath("/dashboard", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while restoring the folder." };
  }
}
