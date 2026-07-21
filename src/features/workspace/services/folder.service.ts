import { MAX_FOLDER_DEPTH } from "@/constants/workspace";
import {
  CircularFolderMoveError,
  DuplicateFolderNameError,
  FolderNotFoundError,
  MaxFolderDepthExceededError,
} from "@/features/workspace/errors/workspace-errors";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import type { BreadcrumbNode, FolderContentsDTO, FolderDTO } from "@/features/workspace/types";
import type {
  CreateFolderInput,
  DeleteFolderInput,
  MoveFolderInput,
  RenameFolderInput,
  RestoreFolderInput,
} from "@/features/workspace/validations/folder.schema";
import { db } from "@/lib/db";

export class FolderService {
  /**
   * Retrieves an active folder by ID inside a specific workspace.
   *
   * @throws FolderNotFoundError if folder does not exist or is soft-deleted.
   */
  async getFolderById(workspaceId: string, folderId: string): Promise<FolderDTO> {
    const folder = await db.folder.findFirst({
      where: {
        id: folderId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new FolderNotFoundError(folderId);
    }

    return folder;
  }

  /**
   * Lists active direct child folders and documents inside a specific parent folder (or at workspace root when `parentId` is null).
   */
  async listDirectChildren(workspaceId: string, parentId: string | null): Promise<FolderContentsDTO> {
    let currentFolder: FolderDTO | null = null;
    let breadcrumbs: BreadcrumbNode[] = [];

    if (parentId) {
      currentFolder = await this.getFolderById(workspaceId, parentId);
      breadcrumbs = await navigationService.getBreadcrumbs(workspaceId, parentId);
    }

    const [folders, documents] = await Promise.all([
      db.folder.findMany({
        where: {
          workspaceId,
          parentId: parentId ?? null,
          deletedAt: null,
        },
        orderBy: { name: "asc" },
      }),
      db.document.findMany({
        where: {
          workspaceId,
          folderId: parentId ?? null,
          deletedAt: null,
        },
        orderBy: { title: "asc" },
      }),
    ]);

    // Format DTOs (`BigInt` serialized cleanly to string for JSON transport)
    return {
      currentFolder,
      breadcrumbs,
      folders,
      documents: documents.map((doc) => ({
        ...doc,
        fileSize: doc.fileSize.toString(),
      })),
    };
  }

  /**
   * Creates a new folder inside a workspace after validating invariants (depth & sibling name uniqueness).
   */
  async createFolder(input: CreateFolderInput, userId: string): Promise<FolderDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);

    const targetParentId = input.parentId ?? null;

    if (targetParentId) {
      await this.getFolderById(input.workspaceId, targetParentId);

      // Verify max depth constraint
      const parentBreadcrumbs = await navigationService.getBreadcrumbs(input.workspaceId, targetParentId);
      if (parentBreadcrumbs.length + 1 > MAX_FOLDER_DEPTH) {
        throw new MaxFolderDepthExceededError(MAX_FOLDER_DEPTH);
      }
    }

    // Enforce sibling name uniqueness across active folders
    const existingSibling = await db.folder.findFirst({
      where: {
        workspaceId: input.workspaceId,
        parentId: targetParentId,
        name: input.name,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingSibling) {
      throw new DuplicateFolderNameError(input.name);
    }

    return await db.folder.create({
      data: {
        name: input.name,
        workspaceId: input.workspaceId,
        parentId: targetParentId,
        ownerId: userId,
      },
    });
  }

  /**
   * Renames an existing folder, guaranteeing active sibling name uniqueness.
   */
  async renameFolder(input: RenameFolderInput, userId: string): Promise<FolderDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    const folder = await this.getFolderById(input.workspaceId, input.folderId);

    if (folder.name === input.name) {
      return folder;
    }

    const existingSibling = await db.folder.findFirst({
      where: {
        workspaceId: input.workspaceId,
        parentId: folder.parentId,
        name: input.name,
        id: { not: input.folderId },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingSibling) {
      throw new DuplicateFolderNameError(input.name);
    }

    return await db.folder.update({
      where: { id: input.folderId },
      data: { name: input.name },
    });
  }

  /**
   * Moves a folder to a new parent folder, performing exact circular dependency checks and hierarchy depth validation.
   */
  async moveFolder(input: MoveFolderInput, userId: string): Promise<FolderDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    const folder = await this.getFolderById(input.workspaceId, input.folderId);

    const targetParentId = input.newParentId ?? null;
    if (targetParentId === folder.parentId) {
      return folder;
    }

    if (targetParentId === input.folderId) {
      throw new CircularFolderMoveError();
    }

    let destinationDepth = 0;
    if (targetParentId) {
      await this.getFolderById(input.workspaceId, targetParentId);

      // Recursive CTE to check circular move (cannot move a folder into its own descendant)
      const isDescendant = await db.$queryRaw<Array<{ id: string }>>`
        WITH RECURSIVE ancestor_check AS (
          SELECT id, "parentId"
          FROM "Folder"
          WHERE id = ${targetParentId}::uuid
            AND "workspaceId" = ${input.workspaceId}::uuid
            AND "deleted_at" IS NULL

          UNION ALL

          SELECT f.id, f."parentId"
          FROM "Folder" f
          INNER JOIN ancestor_check ac ON f.id = ac."parentId"
          WHERE f."workspaceId" = ${input.workspaceId}::uuid
            AND f."deleted_at" IS NULL
        )
        SELECT id FROM ancestor_check WHERE id = ${input.folderId}::uuid LIMIT 1;
      `;

      if (isDescendant.length > 0) {
        throw new CircularFolderMoveError();
      }

      const destBreadcrumbs = await navigationService.getBreadcrumbs(input.workspaceId, targetParentId);
      destinationDepth = destBreadcrumbs.length;
    }

    // Calculate maximum descendant depth of the folder being moved
    const subtreeDepthResult = await db.$queryRaw<Array<{ max_depth: number }>>`
      WITH RECURSIVE subtree_depth AS (
        SELECT id, 1 AS depth
        FROM "Folder"
        WHERE id = ${input.folderId}::uuid
          AND "workspaceId" = ${input.workspaceId}::uuid
          AND "deleted_at" IS NULL

        UNION ALL

        SELECT f.id, sd.depth + 1
        FROM "Folder" f
        INNER JOIN subtree_depth sd ON f."parentId" = sd.id
        WHERE f."workspaceId" = ${input.workspaceId}::uuid
          AND f."deleted_at" IS NULL
      )
      SELECT MAX(depth)::int AS max_depth FROM subtree_depth;
    `;

    const subtreeDepth = subtreeDepthResult[0]?.max_depth ?? 1;
    if (destinationDepth + subtreeDepth > MAX_FOLDER_DEPTH) {
      throw new MaxFolderDepthExceededError(MAX_FOLDER_DEPTH);
    }

    // Check sibling uniqueness in new destination
    const existingSibling = await db.folder.findFirst({
      where: {
        workspaceId: input.workspaceId,
        parentId: targetParentId,
        name: folder.name,
        id: { not: input.folderId },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingSibling) {
      throw new DuplicateFolderNameError(folder.name);
    }

    return await db.folder.update({
      where: { id: input.folderId },
      data: { parentId: targetParentId },
    });
  }

  /**
   * Atomically soft-deletes a folder, its recursive child folders, and all contained documents (`deletedAt = now()`) inside a transaction.
   */
  async deleteFolder(input: DeleteFolderInput, userId: string): Promise<void> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    await this.getFolderById(input.workspaceId, input.folderId);

    const deleteTimestamp = new Date();

    await db.$transaction(async (tx) => {
      // Find all descendant folder IDs using recursive CTE inside transaction
      const descendantRows = await tx.$queryRaw<Array<{ id: string }>>`
        WITH RECURSIVE folder_subtree AS (
          SELECT id
          FROM "Folder"
          WHERE id = ${input.folderId}::uuid
            AND "workspaceId" = ${input.workspaceId}::uuid
            AND "deleted_at" IS NULL

          UNION ALL

          SELECT f.id
          FROM "Folder" f
          INNER JOIN folder_subtree fs ON f."parentId" = fs.id
          WHERE f."workspaceId" = ${input.workspaceId}::uuid
            AND f."deleted_at" IS NULL
        )
        SELECT id FROM folder_subtree;
      `;

      const folderIds = descendantRows.map((row) => row.id);

      if (folderIds.length === 0) {
        return;
      }

      // Soft delete all discovered folders
      await tx.folder.updateMany({
        where: {
          id: { in: folderIds },
          workspaceId: input.workspaceId,
          deletedAt: null,
        },
        data: { deletedAt: deleteTimestamp },
      });

      // Soft delete all documents inside those folders
      await tx.document.updateMany({
        where: {
          folderId: { in: folderIds },
          workspaceId: input.workspaceId,
          deletedAt: null,
        },
        data: { deletedAt: deleteTimestamp },
      });
    });
  }

  /**
   * Restores a soft-deleted folder subtree using exact-timestamp matching to avoid restoring items deleted prior to the folder cascade.
   */
  async restoreFolder(input: RestoreFolderInput, userId: string): Promise<void> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);

    const targetFolder = await db.folder.findFirst({
      where: {
        id: input.folderId,
        workspaceId: input.workspaceId,
      },
    });

    if (!targetFolder || !targetFolder.deletedAt) {
      throw new FolderNotFoundError(input.folderId);
    }

    const cascadeTimestamp = targetFolder.deletedAt;

    // If parent is also soft-deleted, reparent target to root so it becomes visible and accessible
    let targetParentId = targetFolder.parentId;
    if (targetParentId) {
      const parent = await db.folder.findFirst({
        where: { id: targetParentId, workspaceId: input.workspaceId },
      });
      if (parent && parent.deletedAt) {
        targetParentId = null;
      }
    }

    await db.$transaction(async (tx) => {
      // Find all descendant folders that were soft-deleted at exact same cascade timestamp
      const descendantRows = await tx.$queryRaw<Array<{ id: string }>>`
        WITH RECURSIVE folder_subtree AS (
          SELECT id
          FROM "Folder"
          WHERE id = ${input.folderId}::uuid
            AND "workspaceId" = ${input.workspaceId}::uuid

          UNION ALL

          SELECT f.id
          FROM "Folder" f
          INNER JOIN folder_subtree fs ON f."parentId" = fs.id
          WHERE f."workspaceId" = ${input.workspaceId}::uuid
            AND f."deleted_at" = ${cascadeTimestamp}::timestamp
        )
        SELECT id FROM folder_subtree;
      `;

      const folderIds = descendantRows.map((r) => r.id);

      await tx.folder.updateMany({
        where: {
          id: { in: folderIds },
          workspaceId: input.workspaceId,
          deletedAt: cascadeTimestamp,
        },
        data: { deletedAt: null },
      });

      if (targetParentId !== targetFolder.parentId) {
        await tx.folder.update({
          where: { id: input.folderId },
          data: { parentId: targetParentId },
        });
      }

      await tx.document.updateMany({
        where: {
          folderId: { in: folderIds },
          workspaceId: input.workspaceId,
          deletedAt: cascadeTimestamp,
        },
        data: { deletedAt: null },
      });
    });
  }
}

export const folderService = new FolderService();
