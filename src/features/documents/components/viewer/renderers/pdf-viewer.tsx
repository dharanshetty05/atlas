"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { getDownloadUrlAction } from "@/actions/document-viewer";

interface PDFViewerProps {
  documentId: string;
  workspaceId: string;
  readUrl: string;
  activePage: number;
  onTotalPagesChange: (pages: number) => void;
  originalFilename: string;
}

let pdfjsLoadPromise: Promise<any> | null = null;

function loadPdfJsLib(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR not supported");
  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }
  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(lib);
      } else {
        reject(new Error("PDF.js library failed to initialize on window object"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js CDN script"));
    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  documentId,
  workspaceId,
  readUrl,
  activePage,
  onTotalPagesChange,
  originalFilename,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [isDownloading, startTransition] = useTransition();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    loadPdfJsLib()
      .then(async (pdfjsLib) => {
        if (!isMounted) return;
        try {
          const loadingTask = pdfjsLib.getDocument({
            url: readUrl,
            withCredentials: true,
          });
          const doc = await loadingTask.promise;
          if (!isMounted) return;

          setPdfDoc(doc);
          onTotalPagesChange(doc.numPages);
          setIsLoading(false);
        } catch (err) {
          if (isMounted) {
            console.error("PDF.js failed to load document:", err);
            setHasError(true);
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to initialize PDF.js:", err);
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [readUrl, onTotalPagesChange]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(activePage);
        if (!isMounted || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        if (isMounted) {
          console.error("PDF.js page render error:", err);
          setHasError(true);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, activePage]);

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
        <p className="mt-3 text-xs font-medium">Loading PDF preview...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl">
          <p className="text-base font-semibold text-neutral-100">Unable to preview this document.</p>
          <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
            The PDF file <span className="font-semibold text-neutral-200">{originalFilename}</span> could not be rendered in the browser.
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
    <div className="flex h-full w-full flex-col items-center justify-start overflow-auto bg-neutral-950 p-6">
      <div className="flex items-center justify-center shadow-2xl rounded bg-white">
        <canvas ref={canvasRef} className="block rounded shadow-2xl" />
      </div>
    </div>
  );
};
