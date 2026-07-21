import {
  UnauthorizedWorkspaceAccessError,
  WorkspaceNotFoundError,
} from "@/features/workspace/errors/workspace-errors";
import type { WorkspaceOverviewDTO } from "@/features/workspace/types";
import { db } from "@/lib/db";

export class WorkspaceService {
  /**
   * Verifies that the given user has access to the given workspace.
   * In V1 (1:1 User -> Workspace), this checks that `ownerId === userId`.
   * In future milestones (V2+), this check will query `WorkspaceMember` without changing domain queries.
   *
   * @throws UnauthorizedWorkspaceAccessError if access is denied or workspace does not exist.
   */
  async verifyWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
      },
      select: { id: true },
    });

    if (!workspace) {
      throw new UnauthorizedWorkspaceAccessError();
    }
  }

  /**
   * Retrieves or provisions the default personal workspace for the user.
   */
  async getOrCreatePersonalWorkspace(userId: string) {
    let workspace = await db.workspace.findUnique({
      where: { ownerId: userId },
    });

    if (!workspace) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      const name = user?.name
        ? `${user.name}'s Workspace`
        : "Personal Workspace";

      workspace = await db.workspace.create({
        data: {
          name,
          ownerId: userId,
        },
      });
    }

    return workspace;
  }

  /**
   * Retrieves overview data (metadata + active item counts) for a workspace.
   */
  async getWorkspaceOverview(userId: string, workspaceId?: string): Promise<WorkspaceOverviewDTO> {
    let targetWorkspaceId = workspaceId;

    if (!targetWorkspaceId) {
      const personal = await this.getOrCreatePersonalWorkspace(userId);
      targetWorkspaceId = personal.id;
    } else {
      await this.verifyWorkspaceAccess(userId, targetWorkspaceId);
    }

    const [workspace, folderCount, documentCount] = await Promise.all([
      db.workspace.findUnique({
        where: { id: targetWorkspaceId },
      }),
      db.folder.count({
        where: {
          workspaceId: targetWorkspaceId,
          deletedAt: null,
        },
      }),
      db.document.count({
        where: {
          workspaceId: targetWorkspaceId,
          deletedAt: null,
        },
      }),
    ]);

    if (!workspace) {
      throw new WorkspaceNotFoundError(targetWorkspaceId);
    }

    return {
      workspace,
      folderCount,
      documentCount,
    };
  }

  /**
   * Renames a workspace.
   */
  async renameWorkspace(userId: string, workspaceId: string, name: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return await db.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }
}

export const workspaceService = new WorkspaceService();
