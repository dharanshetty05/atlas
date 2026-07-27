"use client";

import React, { useState, useCallback, useTransition } from "react";
import type { DocumentViewerPayloadDTO } from "@/features/documents/types/viewer.types";
import { DocumentHeader } from "@/features/documents/components/viewer/document-header";
import { DocumentToolbar } from "@/features/documents/components/viewer/document-toolbar";
import { DocumentPreview } from "@/features/documents/components/viewer/document-preview";
import { DocumentMetadata } from "@/features/documents/components/viewer/document-metadata";
import { renameDocumentAction } from "@/actions/document";

const getBaseName = (title: string, originalFilename: string) => {
  const extIdx = originalFilename.lastIndexOf('.');
  const ext = extIdx !== -1 ? originalFilename.substring(extIdx) : "";
  if (ext && title.toLowerCase().endsWith(ext.toLowerCase())) {
    return title.slice(0, -ext.length);
  }
  return title;
};

interface DocumentViewerShellProps {
  payload: DocumentViewerPayloadDTO;
}

export const DocumentViewerShell: React.FC<DocumentViewerShellProps> = ({ payload }) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isMetadataOpen, setIsMetadataOpen] = useState<boolean>(true);

  const { context, breadcrumbs } = payload;
  const isPdf = context.document.mimeType.toLowerCase() === "application/pdf" || context.document.originalFilename.toLowerCase().endsWith(".pdf");

  const [isPending, startTransition] = useTransition();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState(() => getBaseName(context.document.title, context.document.originalFilename));
  const [renameError, setRenameError] = useState<string | null>(null);

  const handleTotalPagesChange = useCallback((pages: number) => {
    setTotalPages(pages);
  }, []);

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameName.trim() || isPending) return;
    setRenameError(null);

    startTransition(async () => {
      const res = await renameDocumentAction({
        documentId: context.document.id,
        workspaceId: context.document.workspaceId,
        title: renameName.trim(),
      });
      if (!res.success) {
        setRenameError(res.error);
      } else {
        setIsRenameModalOpen(false);
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* Top Header Bar */}
      <DocumentHeader
        breadcrumbs={breadcrumbs}
        documentTitle={context.document.title}
        status={context.document.status}
        actionsSlot={
          <button
            type="button"
            onClick={() => {
              setRenameName(getBaseName(context.document.title, context.document.originalFilename));
              setRenameError(null);
              setIsRenameModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-700 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Rename
          </button>
        }
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

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRename}
            className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-neutral-100">
              Rename Document
            </h3>
            {renameError && (
              <div className="mt-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs font-medium text-rose-300">
                {renameError}
              </div>
            )}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-neutral-300">
                New Title
              </label>
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                required
                disabled={isPending}
                className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !renameName.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
