import React from "react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { documentService } from "@/features/workspace/services/document.service";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import { buildDocumentContentUrl } from "@/features/documents/utils/document-content-url";
import { DocumentNotFoundError } from "@/features/workspace/errors/workspace-errors";
import { DocumentViewerShell } from "@/features/documents/components/viewer/document-viewer-shell";
import type { DocumentViewerPayloadDTO } from "@/features/documents/types/viewer.types";

export const dynamic = "force-dynamic";

interface DocumentPageProps {
  params: Promise<{ documentId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { documentId } = await params;
  const { user } = await requireAuth();

  try {
    const overview = await workspaceService.getWorkspaceOverview(user.id);
    const workspaceId = overview.workspace.id;

    await workspaceService.verifyWorkspaceAccess(user.id, workspaceId);

    // 1. Retrieve domain metadata
    const document = await documentService.getDocumentById(workspaceId, documentId);

    const readUrl = buildDocumentContentUrl(documentId);

    // 2. Fetch navigation context concurrently
    const [breadcrumbs, adjacent] = await Promise.all([
      navigationService.getBreadcrumbs(workspaceId, document.folderId),
      navigationService.getAdjacentDocuments(workspaceId, document.folderId, documentId),
    ]);

    const payload: DocumentViewerPayloadDTO = {
      context: { document, readUrl },
      breadcrumbs,
      adjacent,
    };

    return <DocumentViewerShell payload={payload} />;
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      notFound();
    }
    throw err;
  }
}
