import { DocumentNotFoundError, InvalidDocumentFileError, FolderNotFoundError, InvalidDocumentNameError } from "@/features/workspace/errors/workspace-errors";
import { folderService } from "@/features/workspace/services/folder.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import type { DocumentDTO } from "@/features/workspace/types";
import { storageService } from "@/features/uploads/services/storage.service";
import crypto from "crypto";
import path from "path";
import type {
  CreateDocumentRecordInput,
  DeleteDocumentInput,
  MoveDocumentInput,
  RenameDocumentInput,
  RestoreDocumentInput,
} from "@/features/workspace/validations/document.schema";
import { db } from "@/lib/db";
import { MAX_ENTITY_NAME_LENGTH } from "@/constants/workspace";
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
   * Uploads a new document file into a workspace/folder.
   */
  async upload(userId: string, file: File, folderId?: string | null): Promise<DocumentDTO> {
    if (!file || file.size === 0) {
      throw new InvalidDocumentFileError("File is empty.");
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      throw new InvalidDocumentFileError("File exceeds maximum size of 50MB.");
    }

    const mimeType = file.type || "application/octet-stream";
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "text/plain",
      "text/markdown",
    ];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new InvalidDocumentFileError(`Unsupported file type: ${mimeType}`);
    }

    let workspaceId: string;
    let targetFolderId = folderId ?? null;

    if (targetFolderId) {
      const folder = await db.folder.findFirst({
        where: { id: targetFolderId, deletedAt: null },
        select: { workspaceId: true },
      });
      if (!folder) {
        throw new FolderNotFoundError(targetFolderId);
      }
      workspaceId = folder.workspaceId;
    } else {
      const personalWorkspace = await workspaceService.getOrCreatePersonalWorkspace(userId);
      workspaceId = personalWorkspace.id;
    }

    await workspaceService.verifyWorkspaceAccess(userId, workspaceId);

    const sanitizedFilename = path.basename(file.name) || "untitled";
    const extension = path.extname(sanitizedFilename) || "";
    const storageKey = `${workspaceId}/${crypto.randomUUID()}${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await storageService.uploadObject(storageKey, buffer, mimeType);

    try {
      const doc = await db.document.create({
        data: {
          title: sanitizedFilename,
          originalFilename: sanitizedFilename,
          mimeType,
          fileSize: file.size,
          storageKey,
          folderId: targetFolderId,
          workspaceId,
          ownerId: userId,
          status: "READY",
        },
      });

      return {
        ...doc,
        fileSize: doc.fileSize.toString(),
      };
    } catch (error) {
      await storageService.deleteObject(storageKey);
      throw error;
    }
  }

  /**
   * Renames a document's title (`Last Write Wins` concurrency).
   */
  async renameDocument(input: RenameDocumentInput, userId: string): Promise<DocumentDTO> {
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) {
      throw new InvalidDocumentNameError("Title cannot be empty.");
    }
    if (trimmedTitle.length > MAX_ENTITY_NAME_LENGTH) {
      throw new InvalidDocumentNameError(`Title cannot exceed ${MAX_ENTITY_NAME_LENGTH} characters.`);
    }

    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    const doc = await this.getDocumentById(input.workspaceId, input.documentId);

    const originalExt = path.extname(doc.originalFilename);
    let finalTitle = trimmedTitle;
    if (originalExt && !finalTitle.toLowerCase().endsWith(originalExt.toLowerCase())) {
      finalTitle = `${finalTitle}${originalExt}`;
    }

    if (doc.title === finalTitle) {
      return {
        ...doc,
        fileSize: doc.fileSize.toString(),
      };
    }

    const updatedDoc = await db.document.update({
      where: { id: input.documentId },
      data: { title: finalTitle },
    });

    return {
      ...updatedDoc,
      fileSize: updatedDoc.fileSize.toString(),
    };
  }

  /**
   * Moves a document to a different folder inside the same workspace (or to workspace root if `newFolderId` is null).
   */
  async moveDocument(input: MoveDocumentInput, userId: string): Promise<DocumentDTO> {
    await workspaceService.verifyWorkspaceAccess(userId, input.workspaceId);
    const existingDoc = await this.getDocumentById(input.workspaceId, input.documentId);

    const targetFolderId = input.newFolderId ?? null;
    if (existingDoc.folderId === targetFolderId) {
      return existingDoc;
    }

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
