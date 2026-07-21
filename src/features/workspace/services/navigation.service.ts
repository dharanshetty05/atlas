import { db } from "@/lib/db";
import { FolderNotFoundError } from "@/features/workspace/errors/workspace-errors";
import type { BreadcrumbNode, FolderTreeNode } from "@/features/workspace/types";
import type { AdjacentDocumentsDTO } from "@/features/documents/types/viewer.types";

export class NavigationService {
  /**
   * Computes the breadcrumb path from the root of the workspace down to the specified folder
   * using a high-speed PostgreSQL recursive CTE (`WITH RECURSIVE`).
   *
   * @param workspaceId The target workspace ID.
   * @param folderId The target folder ID (or null for root).
   * @returns Array of breadcrumb nodes ordered from root to current folder.
   */
  async getBreadcrumbs(workspaceId: string, folderId: string | null): Promise<BreadcrumbNode[]> {
    if (!folderId) {
      return [];
    }

    // Verify folder exists and is active in this workspace
    const folderExists = await db.folder.findFirst({
      where: {
        id: folderId,
        workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!folderExists) {
      throw new FolderNotFoundError(folderId);
    }

    // Recursive CTE ascending the parentId chain from current node to root
    const rawRows = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        depth: number;
      }>
    >`
      WITH RECURSIVE folder_path AS (
        -- Base case: current folder
        SELECT id, name, "parentId", 1 AS depth
        FROM "Folder"
        WHERE id = ${folderId}::uuid
          AND "workspaceId" = ${workspaceId}::uuid
          AND "deleted_at" IS NULL

        UNION ALL

        -- Recursive step: ascend to parent
        SELECT f.id, f.name, f."parentId", fp.depth + 1
        FROM "Folder" f
        INNER JOIN folder_path fp ON f.id = fp."parentId"
        WHERE f."workspaceId" = ${workspaceId}::uuid
          AND f."deleted_at" IS NULL
      )
      SELECT id, name, depth
      FROM folder_path
      ORDER BY depth DESC;
    `;

    return rawRows.map((row) => ({
      id: row.id,
      name: row.name,
    }));
  }

  /**
   * Retrieves the full active folder hierarchy for a workspace to populate navigation sidebars
   * using a single PostgreSQL recursive CTE query, then builds the tree structure in memory.
   *
   * @param workspaceId The target workspace ID.
   * @returns Nested tree of active folders (`FolderTreeNode[]`).
   */
  async getFolderTree(workspaceId: string): Promise<FolderTreeNode[]> {
    const rawRows = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        parentId: string | null;
      }>
    >`
      WITH RECURSIVE folder_tree AS (
        -- Base case: root level folders
        SELECT id, name, "parentId", 1 AS depth
        FROM "Folder"
        WHERE "workspaceId" = ${workspaceId}::uuid
          AND "parentId" IS NULL
          AND "deleted_at" IS NULL

        UNION ALL

        -- Recursive step: active child folders
        SELECT f.id, f.name, f."parentId", ft.depth + 1
        FROM "Folder" f
        INNER JOIN folder_tree ft ON f."parentId" = ft.id
        WHERE f."workspaceId" = ${workspaceId}::uuid
          AND f."deleted_at" IS NULL
      )
      SELECT id, name, "parentId"
      FROM folder_tree
      ORDER BY name ASC;
    `;

    // Map rows to tree structure in O(N)
    const nodeMap = new Map<string, FolderTreeNode>();
    const roots: FolderTreeNode[] = [];

    for (const row of rawRows) {
      nodeMap.set(row.id, {
        id: row.id,
        name: row.name,
        parentId: row.parentId,
        children: [],
      });
    }

    for (const row of rawRows) {
      const node = nodeMap.get(row.id)!;
      if (row.parentId && nodeMap.has(row.parentId)) {
        nodeMap.get(row.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Computes adjacent sibling documents (`prev` and `next`) within the same folder
   * to power seamless toolbar navigation across documents.
   */
  async getAdjacentDocuments(
    workspaceId: string,
    folderId: string | null,
    currentDocumentId: string
  ): Promise<AdjacentDocumentsDTO> {
    const siblings = await db.document.findMany({
      where: {
        workspaceId,
        folderId,
        deletedAt: null,
        status: "READY",
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: [
        { title: "asc" },
        { createdAt: "asc" },
      ],
    });

    const currentIndex = siblings.findIndex((doc) => doc.id === currentDocumentId);
    if (currentIndex === -1) {
      return { prev: null, next: null };
    }

    const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    const next = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

    return {
      prev: prev ? { id: prev.id, title: prev.title } : null,
      next: next ? { id: next.id, title: next.title } : null,
    };
  }
}

export const navigationService = new NavigationService();
