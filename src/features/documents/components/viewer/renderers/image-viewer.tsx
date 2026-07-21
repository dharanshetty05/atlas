"use client";

import React, { useState, useTransition } from "react";
import { getDownloadUrlAction } from "@/actions/document-viewer";

interface ImageViewerProps {
  documentId: string;
  workspaceId: string;
  readUrl: string;
  originalFilename: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  documentId,
  workspaceId,
  readUrl,
  originalFilename,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, startTransition] = useTransition();

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

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl">
          <p className="text-base font-semibold text-neutral-100">Unable to preview this document.</p>
          <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
            The image asset <span className="font-semibold text-neutral-200">{originalFilename}</span> could not be loaded.
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
    <div className="relative flex h-full w-full items-center justify-center overflow-auto bg-neutral-950 p-6">
      {isImageLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-xs text-neutral-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-xs font-medium">Loading image...</p>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={readUrl}
        alt={originalFilename}
        onLoad={() => setIsImageLoading(false)}
        onError={() => setHasError(true)}
        className="max-h-[85vh] max-w-[85vw] object-contain shadow-2xl rounded"
      />
    </div>
  );
};
