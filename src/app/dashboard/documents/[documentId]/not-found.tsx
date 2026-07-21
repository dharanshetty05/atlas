import React from "react";
import Link from "next/link";

export default function DocumentNotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-neutral-950 p-6 text-center text-neutral-100">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </div>

        <h2 className="mt-5 text-lg font-bold text-white">Document Not Found</h2>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
          The requested document could not be located in this workspace hierarchy. It may have been permanently deleted, moved to another workspace, or the link has expired.
        </p>

        <div className="mt-6 flex w-full">
          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/25"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Workspace Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
