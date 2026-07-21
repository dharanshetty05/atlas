"use client";

import React from "react";
import type { DocumentViewerContextDTO } from "@/features/documents/types/viewer.types";
import { PDFViewer } from "@/features/documents/components/viewer/renderers/pdf-viewer";
import { ImageViewer } from "@/features/documents/components/viewer/renderers/image-viewer";
import { TextViewer } from "@/features/documents/components/viewer/renderers/text-viewer";
import { UnsupportedViewer } from "@/features/documents/components/viewer/renderers/unsupported-viewer";
import { ProcessingCard } from "@/features/documents/components/viewer/states/processing-card";

interface DocumentPreviewProps {
  context: DocumentViewerContextDTO;
  activePage: number;
  onTotalPagesChange: (pages: number) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  context,
  activePage,
  onTotalPagesChange,
}) => {
  const { document, readUrl } = context;

  if (document.status !== "READY") {
    return <ProcessingCard status={document.status} originalFilename={document.originalFilename} />;
  }

  const cleanMime = document.mimeType.toLowerCase().trim();
  const filename = document.originalFilename.toLowerCase();

  // 1. PDF check
  if (cleanMime === "application/pdf" || filename.endsWith(".pdf")) {
    return (
      <PDFViewer
        documentId={document.id}
        workspaceId={document.workspaceId}
        readUrl={readUrl}
        activePage={activePage}
        onTotalPagesChange={onTotalPagesChange}
        originalFilename={document.originalFilename}
      />
    );
  }

  // 2. Image check
  if (
    cleanMime.startsWith("image/") ||
    filename.endsWith(".png") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".gif") ||
    filename.endsWith(".webp")
  ) {
    return (
      <ImageViewer
        documentId={document.id}
        workspaceId={document.workspaceId}
        readUrl={readUrl}
        originalFilename={document.originalFilename}
      />
    );
  }

  // 3. Text check
  if (
    cleanMime.startsWith("text/") ||
    cleanMime === "application/json" ||
    filename.endsWith(".txt") ||
    filename.endsWith(".csv") ||
    filename.endsWith(".md") ||
    filename.endsWith(".json")
  ) {
    return (
      <TextViewer
        documentId={document.id}
        workspaceId={document.workspaceId}
        readUrl={readUrl}
        originalFilename={document.originalFilename}
      />
    );
  }

  // 4. Unsupported format fallback
  return (
    <UnsupportedViewer
      documentId={document.id}
      workspaceId={document.workspaceId}
      originalFilename={document.originalFilename}
      mimeType={document.mimeType}
      fileSize={document.fileSize}
    />
  );
};
