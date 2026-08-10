"use client";

import React from "react";
import Link from "next/link";
import type { BreadcrumbNode } from "@/features/workspace/types";
import type { DocumentStatus } from "@prisma/client";

interface DocumentHeaderProps {
  breadcrumbs: BreadcrumbNode[];
  documentTitle: string;
  status: DocumentStatus;
  actionsSlot?: React.ReactNode;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  breadcrumbs,
  documentTitle,
  status,
  actionsSlot,
}) => {
  const isReady = status === "READY";
  const isArchived = status === "ARCHIVED";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 select-none z-20">
      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center gap-2 overflow-hidden text-xs">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 font-semibold text-neutral-400 hover:text-indigo-400 transition-colors shrink-0"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>

        {breadcrumbs.map((node) => (
          <React.Fragment key={node.id}>
            <span className="text-neutral-600 shrink-0">/</span>
            <Link
              href={`/dashboard/folders/${node.id}`}
              className="truncate font-medium text-neutral-400 hover:text-neutral-200 transition-colors max-w-[140px]"
              title={node.name}
            >
              {node.name}
            </Link>
          </React.Fragment>
        ))}

        <span className="text-neutral-600 shrink-0">/</span>
        <span
          className="truncate font-bold text-neutral-100 max-w-[200px] sm:max-w-[320px]"
          title={documentTitle}
        >
          {documentTitle}
        </span>

        <span
          className={`ml-2 hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
            status === "READY"
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
              : status === "FAILED"
              ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30"
              : status === "PROCESSING"
              ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30"
              : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
          }`}
        >
          {status === "READY" ? "AI analysis complete" : status === "PROCESSING" ? "AI analysis in progress" : status === "FAILED" ? "AI analysis failed" : status === "UPLOADING" ? "AI analysis pending" : status}
        </span>
      </div>

      {/* Optional Action / Bookmark Slot */}
      <div className="flex items-center gap-2">
        {actionsSlot}
      </div>
    </header>
  );
};
