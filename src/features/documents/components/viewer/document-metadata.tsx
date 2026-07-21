"use client";

import React from "react";
import type { DocumentDTO } from "@/features/workspace/types";

interface DocumentMetadataProps {
  document: DocumentDTO & {
    owner?: { id: string; name?: string | null; email?: string | null };
  };
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const sizeKb = Number(document.fileSize) / 1024;
  const formattedSize = sizeKb >= 1024 ? (sizeKb / 1024).toFixed(2) + " MB" : sizeKb.toFixed(1) + " KB";

  const maskedStorageKey = document.storageKey.length > 28
    ? document.storageKey.substring(0, 16) + "..." + document.storageKey.substring(document.storageKey.length - 8)
    : document.storageKey;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-neutral-800 bg-neutral-900/95 text-neutral-100 shadow-2xl backdrop-blur-md transition-all z-20 overflow-y-auto">
      {/* Drawer Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-5">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-bold tracking-tight text-white">Document Inspector</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          title="Close Sidebar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 space-y-6 p-5 text-xs">
        {/* Title Section */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Document Title</span>
          <p className="mt-1 font-semibold text-neutral-100 text-sm break-words">{document.title}</p>
        </div>

        {/* Original Filename */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Original Filename</span>
          <p className="mt-1 font-mono text-neutral-300 break-all bg-neutral-950/80 p-2 rounded border border-neutral-800/80">
            {document.originalFilename}
          </p>
        </div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-neutral-800/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">MIME Type</span>
            <div className="mt-1">
              <span className="inline-block rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-400 border border-indigo-500/30">
                {document.mimeType}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">File Size</span>
            <p className="mt-1 font-semibold text-neutral-200">{formattedSize}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</span>
            <div className="mt-1">
              <span
                className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  document.status === "READY"
                    ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                }`}
              >
                {document.status}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Owner</span>
            <p className="mt-1 font-medium text-neutral-200 truncate" title={document.owner?.email ?? ""}>
              {document.owner?.name ?? "Current User"}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Created At</span>
            <p className="mt-1 text-neutral-300 font-mono text-[11px]">
              {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Last Modified</span>
            <p className="mt-1 text-neutral-300 font-mono text-[11px]">
              {new Date(document.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Security & Audit Info */}
        <div className="pt-2 border-t border-neutral-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Storage Key (Audit Hash)</span>
          <p className="mt-1 font-mono text-[11px] text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-800 break-all select-all">
            {maskedStorageKey}
          </p>
          <p className="mt-1.5 text-[10px] text-neutral-500">
            Storage keys are isolated inside multi-tenant object storage buckets and accessible only via short-lived presigned tokens.
          </p>
        </div>
      </div>
    </aside>
  );
};
