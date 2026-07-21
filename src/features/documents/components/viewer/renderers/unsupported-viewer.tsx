"use client";

import React, { useTransition } from "react";
import { getDownloadUrlAction } from "@/actions/document-viewer";

interface UnsupportedViewerProps {
  documentId: string;
  workspaceId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: string;
}

export const UnsupportedViewer: React.FC<UnsupportedViewerProps> = ({
  documentId,
  workspaceId,
  originalFilename,
  mimeType,
  fileSize,
}) => {
  const [isDownloading, startTransition] = useTransition();

  const formattedSize = (Number(fileSize) / 1024).toFixed(1) + " KB";

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
    <div className="flex flex-1 flex-col items-center justify-center bg-neutral-950 p-6 text-center">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl">
        <h3 className="text-base font-semibold text-neutral-100">Unable to preview this document.</h3>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
          The format <span className="font-semibold text-neutral-200">({mimeType})</span> is not supported for web viewing. You can download the file directly.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-400">
          <span className="rounded-md bg-neutral-800 px-2.5 py-1 font-mono text-neutral-300 border border-neutral-700">
            {originalFilename}
          </span>
          <span className="rounded-md bg-neutral-800 px-2 py-1 font-mono text-neutral-300 border border-neutral-700">
            {formattedSize}
          </span>
        </div>

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
};
