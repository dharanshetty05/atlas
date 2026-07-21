"use client";

import React, { useState, useCallback } from "react";
import type { DocumentViewerPayloadDTO } from "@/features/documents/types/viewer.types";
import { DocumentHeader } from "@/features/documents/components/viewer/document-header";
import { DocumentToolbar } from "@/features/documents/components/viewer/document-toolbar";
import { DocumentPreview } from "@/features/documents/components/viewer/document-preview";
import { DocumentMetadata } from "@/features/documents/components/viewer/document-metadata";

interface DocumentViewerShellProps {
  payload: DocumentViewerPayloadDTO;
}

export const DocumentViewerShell: React.FC<DocumentViewerShellProps> = ({ payload }) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isMetadataOpen, setIsMetadataOpen] = useState<boolean>(true);

  const { context, breadcrumbs } = payload;
  const isPdf = context.document.mimeType.toLowerCase() === "application/pdf" || context.document.originalFilename.toLowerCase().endsWith(".pdf");

  const handleTotalPagesChange = useCallback((pages: number) => {
    setTotalPages(pages);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* Top Header Bar */}
      <DocumentHeader
        breadcrumbs={breadcrumbs}
        documentTitle={context.document.title}
        status={context.document.status}
      />

      {/* Interactive Toolbar */}
      <DocumentToolbar
        documentId={context.document.id}
        workspaceId={context.document.workspaceId}
        folderId={context.document.folderId}
        activePage={activePage}
        totalPages={totalPages}
        isMetadataOpen={isMetadataOpen}
        isPdf={isPdf}
        onPageChange={setActivePage}
        onToggleMetadata={() => setIsMetadataOpen((prev) => !prev)}
      />

      {/* Main Viewport & Collapsible Metadata Drawer */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Active Document Canvas Area */}
        <main className="flex flex-1 flex-col overflow-hidden bg-neutral-950/95 relative">
          <DocumentPreview
            context={context}
            activePage={activePage}
            onTotalPagesChange={handleTotalPagesChange}
          />
        </main>

        {/* Collapsible Right Metadata Drawer */}
        <DocumentMetadata
          document={context.document}
          isOpen={isMetadataOpen}
          onClose={() => setIsMetadataOpen(false)}
        />
      </div>
    </div>
  );
};
