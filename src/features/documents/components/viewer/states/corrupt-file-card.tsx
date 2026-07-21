"use client";

import React, { useTransition } from "react";
import { getDownloadUrlAction } from "@/actions/document-viewer";

interface CorruptFileCardProps {
  documentId: string;
  workspaceId: string;
  originalFilename: string;
}

export const CorruptFileCard: React.FC<CorruptFileCardProps> = ({
  documentId,
  workspaceId,
  originalFilename,
}) => {
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-neutral-950 p-6 text-center">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-rose-900/60 bg-rose-950/20 p-8 shadow-xl">
        <h3 className="text-base font-semibold text-neutral-100">Unable to preview this document.</h3>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
          The file <span className="font-semibold text-neutral-200">{originalFilename}</span> appears to be corrupted or incomplete.
        </p>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-100 hover:bg-neutral-700 transition disabled:opacity-50 border border-neutral-700"
        >
          {isDownloading ? "Preparing Download..." : "Download Raw File"}
        </button>
      </div>
    </div>
  );
};
