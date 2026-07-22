"use server";

import { requireAuth } from "@/lib/auth/server";
import { DomainError } from "@/features/workspace/errors/workspace-errors";
import { documentService } from "@/features/workspace/services/document.service";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import { storageService } from "@/features/uploads/services/storage.service";
import {
  getDocumentViewerPayloadSchema,
  getDownloadUrlSchema,
  type GetDocumentViewerPayloadInput,
  type GetDownloadUrlInput,
} from "@/features/documents/validations/viewer.schema";
import type { ActionState } from "@/actions/workspace";
import type { DocumentViewerPayloadDTO } from "@/features/documents/types/viewer.types";

/**
 * Retrieves the complete hydration payload for the Rich Document Viewer,
 * coordinating domain metadata with infrastructure read URLs.
 */
export async function getDocumentViewerPayloadAction(
  input: GetDocumentViewerPayloadInput
): Promise<ActionState<DocumentViewerPayloadDTO>> {
  const validation = getDocumentViewerPayloadSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid request parameters for document viewer.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const { documentId, workspaceId } = validation.data;

    // 1. Verify access and retrieve domain context from DocumentService
    await workspaceService.verifyWorkspaceAccess(user.id, workspaceId);
    const document = await documentService.getDocumentById(workspaceId, documentId);

    // 2. Request infrastructure read URL from StorageService and fetch navigation metadata concurrently
    const [readUrl, breadcrumbs, adjacent] = await Promise.all([
      storageService.generateReadUrl(document.storageKey, document.originalFilename, document.mimeType),
      navigationService.getBreadcrumbs(workspaceId, document.folderId),
      navigationService.getAdjacentDocuments(workspaceId, document.folderId, documentId),
    ]);

    return {
      success: true,
      data: {
        context: { document, readUrl },
        breadcrumbs,
        adjacent,
      },
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while loading the document viewer data." };
  }
}

/**
 * Generates a download URL enforcing `ResponseContentDisposition: attachment`
 * to allow downloading unsupported files or raw binary inspection.
 */
export async function getDownloadUrlAction(
  input: GetDownloadUrlInput
): Promise<ActionState<{ url: string }>> {
  const validation = getDownloadUrlSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid request parameters for download URL.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { user } = await requireAuth();
    const { documentId, workspaceId } = validation.data;

    await workspaceService.verifyWorkspaceAccess(user.id, workspaceId);
    const doc = await documentService.getDocumentById(workspaceId, documentId);

    const url = await storageService.generateDownloadUrl(doc.storageKey, doc.originalFilename);

    return {
      success: true,
      data: { url },
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred while preparing download link." };
  }
}
