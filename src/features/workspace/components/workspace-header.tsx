"use client";

import React, { useState, useTransition } from "react";
import { renameWorkspaceAction } from "@/actions/workspace";
import { DocumentSearch } from "@/features/workspace/components/document-search";
import type { WorkspaceOverviewDTO } from "@/features/workspace/types";

interface WorkspaceHeaderProps {
  overview: WorkspaceOverviewDTO;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ overview }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(overview.workspace.name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await renameWorkspaceAction({
        workspaceId: overview.workspace.id,
        name: name.trim(),
      });
      if (!res.success) {
        setError(res.error);
      } else {
        setIsEditing(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200/80 bg-white/50 px-8 py-6 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 font-bold text-xl shrink-0">
          {overview.workspace.name.charAt(0).toUpperCase()}
        </div>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="rounded-lg border border-indigo-500 bg-white px-3 py-1.5 text-lg font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-neutral-800 dark:text-neutral-100"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setName(overview.workspace.name);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(overview.workspace.name);
                }}
                disabled={isPending}
                className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {overview.workspace.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-opacity"
                title="Rename workspace"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
          <div className="mt-1 flex items-center gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Workspace
            </span>
            <span>•</span>
            <span className="whitespace-nowrap">{overview.folderCount} Folders</span>
            <span>•</span>
            <span className="whitespace-nowrap">{overview.documentCount} Documents</span>
          </div>
        </div>
      </div>
      <div className="w-full sm:w-80 lg:w-96 shrink-0 z-10 flex-1 sm:flex-none">
        <DocumentSearch workspaceId={overview.workspace.id} />
      </div>
    </div>
  );
};
