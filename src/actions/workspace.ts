"use server";

import { requireAuth } from "@/lib/auth/server";
import { DomainError } from "@/features/workspace/errors/workspace-errors";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import {
  renameWorkspaceSchema,
  type RenameWorkspaceInput,
} from "@/features/workspace/validations/workspace.schema";
import { revalidatePath } from "next/cache";

export type ActionState<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; fieldErrors?: Record<string, string[]> };

/**
 * Retrieves the current user's personal workspace and overview metrics.
 */
export async function getWorkspaceOverviewAction(workspaceId?: string): Promise<ActionState<any>> {
  try {
    const { user } = await requireAuth();
    const overview = await workspaceService.getWorkspaceOverview(user.id, workspaceId);
    return { success: true, data: overview };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while loading the workspace." };
  }
}

/**
 * Retrieves the full active folder navigation tree for the sidebar.
 */
export async function getFolderTreeAction(workspaceId?: string): Promise<ActionState<any>> {
  try {
    const { user } = await requireAuth();
    let targetId = workspaceId;
    if (!targetId) {
      const personal = await workspaceService.getOrCreatePersonalWorkspace(user.id);
      targetId = personal.id;
    } else {
      await workspaceService.verifyWorkspaceAccess(user.id, targetId);
    }

    const tree = await navigationService.getFolderTree(targetId);
    return { success: true, data: tree };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while loading the folder hierarchy." };
  }
}

/**
 * Renames the user's workspace.
 */
export async function renameWorkspaceAction(input: RenameWorkspaceInput): Promise<ActionState<any>> {
  const validation = renameWorkspaceSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please verify your input.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const updated = await workspaceService.renameWorkspace(
      user.id,
      validation.data.workspaceId,
      validation.data.name
    );

    revalidatePath("/dashboard", "layout");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while renaming the workspace." };
  }
}
