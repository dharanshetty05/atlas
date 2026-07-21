import React from "react";

export const ViewerSkeleton: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-neutral-950 text-neutral-100 animate-pulse">
      {/* Top Header / Breadcrumbs Bar Skeleton */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-neutral-800" />
          <span className="text-neutral-700">/</span>
          <div className="h-4 w-24 rounded bg-neutral-800" />
          <span className="text-neutral-700">/</span>
          <div className="h-4 w-40 rounded bg-neutral-700" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded-lg bg-neutral-800" />
          <div className="h-8 w-20 rounded-lg bg-neutral-800" />
        </div>
      </div>

      {/* Main Center Area & Sidebar Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Canvas Shimmer */}
        <div className="relative flex flex-1 flex-col items-center justify-center bg-neutral-950 p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs font-medium text-neutral-400">Preparing document preview...</p>
          </div>
          {/* Simulated page border outline */}
          <div className="absolute inset-x-12 inset-y-8 -z-10 rounded-xl border border-neutral-800/40 bg-neutral-900/20" />
        </div>

        {/* Right Metadata Drawer Skeleton (closed or subtle strip on right) */}
        <div className="hidden w-80 shrink-0 flex-col border-l border-neutral-800 bg-neutral-900/50 p-5 lg:flex">
          <div className="h-5 w-32 rounded bg-neutral-800 mb-6" />
          <div className="space-y-4">
            <div className="h-10 w-full rounded-lg bg-neutral-800/60" />
            <div className="h-10 w-full rounded-lg bg-neutral-800/60" />
            <div className="h-10 w-full rounded-lg bg-neutral-800/60" />
            <div className="h-10 w-full rounded-lg bg-neutral-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
};
