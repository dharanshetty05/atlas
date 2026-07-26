"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  createFolderAction,
  deleteFolderAction,
  moveFolderAction,
  renameFolderAction,
} from "@/actions/folder";
import {
  deleteDocumentAction,
  moveDocumentAction,
  renameDocumentAction,
} from "@/actions/document";
import { UploadButton } from "@/features/documents/components/upload-button";
import type { FolderContentsDTO, FolderDTO, DocumentDTO, FolderTreeNode } from "@/features/workspace/types";

interface FolderGridProps {
  contents: FolderContentsDTO;
  workspaceId: string;
  folderTree: FolderTreeNode[];
}

export const FolderGrid: React.FC<FolderGridProps> = ({ contents, workspaceId, folderTree }) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Modal / action state
  const [createType, setCreateType] = useState<"folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "folder" | "document" } | null>(null);
  const [renameName, setRenameName] = useState("");

  // Move modal
  const [moveTarget, setMoveTarget] = useState<{ id: string; name: string; type: "folder" | "document" } | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(contents.currentFolder?.id ?? null);

  const currentParentId = contents.currentFolder?.id ?? null;

  // Flatten folder tree for destination picker
  const flatFolderOptions = React.useMemo(() => {
    const list: Array<{ id: string; name: string; depth: number }> = [];
    const traverse = (nodes: FolderTreeNode[], depth: number) => {
      for (const node of nodes) {
        list.push({ id: node.id, name: node.name, depth });
        if (node.children) traverse(node.children, depth + 1);
      }
    };
    traverse(folderTree, 0);
    return list;
  }, [folderTree]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isPending) return;
    setError(null);

      if (createType === "folder") {
        const res = await createFolderAction({
          workspaceId,
          parentId: currentParentId,
          name: newItemName.trim(),
        });
        if (!res.success) {
          setError(res.error);
        } else {
          setCreateType(null);
          setNewItemName("");
        }
      }
    });
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameName.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      if (renameTarget.type === "folder") {
        const res = await renameFolderAction({
          folderId: renameTarget.id,
          workspaceId,
          name: renameName.trim(),
        });
        if (!res.success) setError(res.error);
        else setRenameTarget(null);
      } else {
        const res = await renameDocumentAction({
          documentId: renameTarget.id,
          workspaceId,
          title: renameName.trim(),
        });
        if (!res.success) setError(res.error);
        else setRenameTarget(null);
      }
    });
  };

  const handleMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTarget || isPending) return;
    setError(null);

    startTransition(async () => {
      if (moveTarget.type === "folder") {
        const res = await moveFolderAction({
          folderId: moveTarget.id,
          workspaceId,
          newParentId: selectedDestinationId === "ROOT" ? null : selectedDestinationId,
        });
        if (!res.success) setError(res.error);
        else setMoveTarget(null);
      } else {
        const res = await moveDocumentAction({
          documentId: moveTarget.id,
          workspaceId,
          newFolderId: selectedDestinationId === "ROOT" ? null : selectedDestinationId,
        });
        if (!res.success) setError(res.error);
        else setMoveTarget(null);
      }
    });
  };

  const handleDelete = (id: string, type: "folder" | "document") => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? It will be moved to the trash.`)) return;
    setError(null);
    startTransition(async () => {
      if (type === "folder") {
        const res = await deleteFolderAction({ folderId: id, workspaceId });
        if (!res.success) setError(res.error);
      } else {
        const res = await deleteDocumentAction({ documentId: id, workspaceId });
        if (!res.success) setError(res.error);
      }
    });
  };

  const isEmpty = contents.folders.length === 0 && contents.documents.length === 0;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {contents.currentFolder ? contents.currentFolder.name : "Root Directory"}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {contents.folders.length} {contents.folders.length === 1 ? "folder" : "folders"}, {contents.documents.length} {contents.documents.length === 1 ? "document" : "documents"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setCreateType("folder");
              setNewItemName("");
              setError(null);
            }}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-2xs transition hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Folder
          </button>

          <UploadButton folderId={currentParentId} onError={setError} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center dark:border-neutral-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Directory is empty
          </h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-500 dark:text-neutral-400">
            Get started by creating a new child folder or document record right here in this workspace hierarchy.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders Section */}
          {contents.folders.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Folders ({contents.folders.length})
              </h3>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {contents.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group relative flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-indigo-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:border-indigo-500/80"
                  >
                    <Link
                      href={`/dashboard/folders/${folder.id}`}
                      className="flex flex-1 items-center gap-3 overflow-hidden"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
                        </svg>
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {folder.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {new Date(folder.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget({ id: folder.id, name: folder.name, type: "folder" });
                          setRenameName(folder.name);
                        }}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="Rename"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoveTarget({ id: folder.id, name: folder.name, type: "folder" });
                          setSelectedDestinationId("ROOT");
                        }}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="Move"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(folder.id, "folder")}
                        className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        title="Delete"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {contents.documents.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Documents ({contents.documents.length})
              </h3>
              <div className="divide-y divide-neutral-200/80 rounded-xl border border-neutral-200/80 bg-white overflow-hidden dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/70">
                {contents.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between px-4 py-3.5 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="flex flex-1 items-center gap-3.5 min-w-0 overflow-hidden"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold text-xs uppercase">
                        DOC
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <span className="truncate">{doc.originalFilename}</span>
                          <span>•</span>
                          <span>{(Number(doc.fileSize) / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget({ id: doc.id, name: doc.title, type: "document" });
                          setRenameName(doc.title);
                        }}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="Rename"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoveTarget({ id: doc.id, name: doc.title, type: "document" });
                          setSelectedDestinationId("ROOT");
                        }}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="Move"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, "document")}
                        className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {createType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Create New Folder
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Enter a unique name for your new folder inside this directory.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Q3 Strategy"
                  required
                  disabled={isPending}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateType(null)}
                disabled={isPending}
                className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !newItemName.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRename}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Rename {renameTarget.type === "folder" ? "Folder" : "Document"}
            </h3>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                New Name
              </label>
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                required
                disabled={isPending}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                autoFocus
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                disabled={isPending}
                className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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

      {/* Move Modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleMove}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Move {moveTarget.name}
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Select a destination parent folder across your hierarchy.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Destination Folder
              </label>
              <select
                value={selectedDestinationId ?? "ROOT"}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                disabled={isPending}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="ROOT">Root Directory (No Parent)</option>
                {flatFolderOptions
                  .filter((opt) => opt.id !== moveTarget.id)
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {"— ".repeat(opt.depth)} {opt.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                disabled={isPending}
                className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? "Moving..." : "Move Here"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
