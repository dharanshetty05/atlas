import { db } from "@/lib/db";
import { DocumentNotFoundError } from "@/features/workspace/errors/workspace-errors";
import { folderService } from "@/features/workspace/services/folder.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import type {
  CreateDocumentRecordInput,
  DeleteDocumentInput,
  MoveDocumentInput,
  RenameDocumentInput,
  RestoreDocumentInput,
} from "@/features/workspace/validations/document.schema";
import type { DocumentDTO } from "@/features/workspace/types";

export class DocumentService {
  /**
   * Retrieves an active document by ID inside a specific workspace.
   *
   * @throws DocumentNotFoundError if document does not exist or is soft-deleted.
   */
  async getDocumentById(workspaceId: string, documentId: string): Promise<DocumentDTO> {
    const doc = await db.document.findFirst({
      where: {
        id: documentId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!doc) {
      throw new DocumentNotFoundError(documentId);
    }

    return {
      ...doc,
      fileSize: doc.fileSize.toString(),
    };
  }

  /**
   * Creates a new document record within a workspace or folder.
   * Note: Document titles may be duplicated within the same folder per architectural decisions.
   */
  async createDocumentRecord(input: CreateDocumentRecordInput, userId: string): Promise<DocumentDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);

    const targetFolderId = input.folderId ?? null;
    if (targetFolderId) {
      await folderService.getFolderById(input.workspaceId, targetFolderId);
    }

    const doc = await db.document.create({
      data: {
        title: input.title,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        storageKey: input.storageKey,
        folderId: targetFolderId,
        workspaceId: input.workspaceId,
        ownerId: userId,
        status: "READY",
      },
    });

    return {
      ...doc,
      fileSize: doc.fileSize.toString(),
    };
  }

  /**
   * Renames a document's title (`Last Write Wins` concurrency).
   */
  async renameDocument(input: RenameDocumentInput, userId: string): Promise<DocumentDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    await this.getDocumentById(input.workspaceId, input.documentId);

    const doc = await db.document.update({
      where: { id: input.documentId },
      data: { title: input.title },
    });

    return {
      ...doc,
      fileSize: doc.fileSize.toString(),
    };
  }

  /**
   * Moves a document to a different folder inside the same workspace (or to workspace root if `newFolderId` is null).
   */
  async moveDocument(input: MoveDocumentInput, userId: string): Promise<DocumentDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    await this.getDocumentById(input.workspaceId, input.documentId);

    const targetFolderId = input.newFolderId ?? null;
    if (targetFolderId) {
      await folderService.getFolderById(input.workspaceId, targetFolderId);
    }

    const doc = await db.document.update({
      where: { id: input.documentId },
      data: { folderId: targetFolderId },
    });

    return {
      ...doc,
      fileSize: doc.fileSize.toString(),
    };
  }

  /**
   * Soft-deletes a document (`deletedAt = now()`).
   */
  async deleteDocument(input: DeleteDocumentInput, userId: string): Promise<void> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    await this.getDocumentById(input.workspaceId, input.documentId);

    await db.document.update({
      where: { id: input.documentId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted document (`deletedAt = null`).
   * If the parent folder is soft-deleted, the document is reparented to root (`folderId: null`) to ensure accessibility.
   */
  async restoreDocument(input: RestoreDocumentInput, userId: string): Promise<void> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);

    const doc = await db.document.findFirst({
      where: {
        id: input.documentId,
        workspaceId: input.workspaceId,
      },
    });

    if (!doc || !doc.deletedAt) {
      throw new DocumentNotFoundError(input.documentId);
    }

    let targetFolderId = doc.folderId;
    if (targetFolderId) {
      const parent = await db.folder.findFirst({
        where: { id: targetFolderId, workspaceId: input.workspaceId },
      });
      if (parent && parent.deletedAt) {
        targetFolderId = null;
      }
    }

    await db.document.update({
      where: { id: input.documentId },
      data: {
        deletedAt: null,
        folderId: targetFolderId,
      },
    });
  }
}

export const documentService = new DocumentService();
