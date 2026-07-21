"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function DocumentError({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string; statusCode?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Document viewer error caught:", error);
  }, [error]);

  const isUnauthorized = error.code === "UNAUTHORIZED_WORKSPACE_ACCESS" || error.statusCode === 403;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-neutral-950 p-6 text-center text-neutral-100">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-rose-900/60 bg-rose-950/20 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="mt-5 text-lg font-bold text-white">
          {isUnauthorized ? "Access Denied" : "Error Loading Document"}
        </h2>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
          {isUnauthorized
            ? "You do not have permission to access resources in this workspace. Please verify your active workspace session or contact the workspace owner."
            : error.message || "An unexpected error occurred while processing the document stream."}
        </p>

        {error.code && (
          <div className="mt-3 rounded bg-neutral-900/90 px-2.5 py-1 font-mono text-[11px] text-rose-400 border border-rose-900/40">
            Error Code: {error.code}
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition border border-neutral-700"
          >
            Retry Loading
          </button>
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
