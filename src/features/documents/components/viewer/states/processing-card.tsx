"use client";

import React from "react";
import type { DocumentStatus } from "@prisma/client";

interface ProcessingCardProps {
  status: DocumentStatus;
  originalFilename: string;
}

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ status, originalFilename }) => {
  const isProcessing = status === "PROCESSING" || status === "UPLOADING";
  const isArchived = status === "ARCHIVED";

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-neutral-950 p-6 text-center">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl backdrop-blur-md">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ring-1 ${
            isProcessing
              ? "bg-indigo-500/10 text-indigo-400 ring-indigo-500/30"
              : isArchived
                ? "bg-amber-500/10 text-amber-400 ring-amber-500/30"
                : "bg-rose-500/10 text-rose-400 ring-rose-500/30"
          }`}
        >
          {isProcessing ? (
            <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : isArchived ? (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          ) : (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 className="mt-5 text-base font-semibold text-neutral-100">
          {isProcessing ? "Document is Processing" : isArchived ? "Document is Archived" : "Processing Failed"}
        </h3>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
          {isProcessing
            ? `The file "${originalFilename}" is currently being processed and prepared for web streaming. Please wait or refresh shortly.`
            : isArchived
              ? `The file "${originalFilename}" has been moved to cold storage archives. Restore it from the workspace dashboard to preview.`
              : `The background worker failed to process "${originalFilename}". Please verify the file integrity or re-upload.`}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-300 border border-neutral-700">
          Status: {status}
        </div>
      </div>
    </div>
  );
};
