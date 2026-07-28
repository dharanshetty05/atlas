"use client";

import { deleteDocumentAction, renameDocumentAction } from "@/actions/document";
import { DocumentHeader } from "@/features/documents/components/viewer/document-header";
import { DocumentMetadata } from "@/features/documents/components/viewer/document-metadata";
import { DocumentPreview } from "@/features/documents/components/viewer/document-preview";
import { DocumentToolbar } from "@/features/documents/components/viewer/document-toolbar";
import type { DocumentViewerPayloadDTO } from "@/features/documents/types/viewer.types";
import { useRouter } from "next/navigation";
import React, { useCallback, useState, useTransition } from "react";

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

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

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setDeleteError(null);

    startTransition(async () => {
      const res = await deleteDocumentAction({
        documentId: context.document.id,
        workspaceId: context.document.workspaceId,
      });
      if (!res.success) {
        setDeleteError(res.error);
      } else {
        setIsDeleteModalOpen(false);
        if (context.document.folderId) {
          router.push(`/dashboard/folders/${context.document.folderId}`);
        } else {
          router.push(`/dashboard`);
        }
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
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-950/50 hover:text-rose-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
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

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleDelete}
            className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-neutral-100">
              Delete Document
            </h3>
            {deleteError && (
              <div className="mt-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs font-medium text-rose-300">
                {deleteError}
              </div>
            )}
            <p className="mt-3 text-sm text-neutral-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{context.document.title}"</span>?
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              This document will be removed from your workspace and hidden from normal views. It is not permanently deleted in this version of Atlas.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
