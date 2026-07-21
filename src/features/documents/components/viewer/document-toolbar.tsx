"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { getDownloadUrlAction } from "@/actions/document-viewer";

interface DocumentToolbarProps {
  documentId: string;
  workspaceId: string;
  folderId: string | null;
  activePage: number;
  totalPages: number;
  isMetadataOpen: boolean;
  isPdf: boolean;
  onPageChange: (page: number) => void;
  onToggleMetadata: () => void;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  documentId,
  workspaceId,
  folderId,
  activePage,
  totalPages,
  isMetadataOpen,
  isPdf,
  onPageChange,
  onToggleMetadata,
}) => {
  const [isDownloading, startTransition] = useTransition();

  const backHref = folderId ? `/dashboard/folders/${folderId}` : "/dashboard";

  const handleDownload = () => {
    startTransition(async () => {
      const res = await getDownloadUrlAction({ documentId, workspaceId });
      if (res.success) {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 text-xs text-neutral-300 select-none z-10">
      {/* Left: Back Button */}
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 font-medium text-neutral-200 hover:bg-neutral-700 transition border border-neutral-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Center: PDF Page Step Controls (For PDFs only) */}
      {isPdf && totalPages > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-950 px-3 py-1 border border-neutral-800">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, activePage - 1))}
            disabled={activePage <= 1}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Previous Page"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="font-mono text-xs text-neutral-300">
            Page <span className="font-semibold text-white">{activePage}</span> of <span className="font-semibold text-white">{totalPages}</span>
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, activePage + 1))}
            disabled={activePage >= totalPages}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Next Page"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Right: Download & Metadata Toggle Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 font-medium text-neutral-200 hover:bg-neutral-700 transition disabled:opacity-50 border border-neutral-700"
          title="Download Document"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{isDownloading ? "..." : "Download"}</span>
        </button>

        <button
          type="button"
          onClick={onToggleMetadata}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition border ${
            isMetadataOpen
              ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700"
          }`}
          title="Toggle Metadata Panel"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Info</span>
        </button>
      </div>
    </div>
  );
};
