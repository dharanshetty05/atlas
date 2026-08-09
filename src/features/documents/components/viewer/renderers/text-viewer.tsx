"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getDownloadUrlAction } from "@/actions/document-viewer";

interface TextViewerProps {
  documentId: string;
  workspaceId: string;
  readUrl: string;
  originalFilename: string;
}

export const TextViewer: React.FC<TextViewerProps> = ({
  documentId,
  workspaceId,
  readUrl,
  originalFilename,
}) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    const loadText = async () => {
      try {
        const res = await fetch(readUrl, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`Failed to fetch text (HTTP ${res.status})`);
        }
        const text = await res.text();
        if (!isMounted) return;
        setContent(text);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load text content:", err);
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadText();

    return () => {
      isMounted = false;
    };
  }, [readUrl]);

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

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 p-6 text-neutral-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="mt-3 text-xs font-medium">Loading text content...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl">
          <p className="text-base font-semibold text-neutral-100">Unable to preview this document.</p>
          <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
            The text document <span className="font-semibold text-neutral-200">{originalFilename}</span> could not be loaded.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {isDownloading ? "Preparing Download..." : "Download File"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-neutral-950 overflow-auto p-6">
      <pre className="font-mono text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap break-all select-text">
        {content}
      </pre>
    </div>
  );
};
