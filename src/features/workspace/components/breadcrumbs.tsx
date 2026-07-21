"use client";

import React from "react";
import Link from "next/link";
import type { BreadcrumbNode } from "@/features/workspace/types";

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbNode[];
  currentFolderName?: string | null;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs, currentFolderName }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </Link>

      {breadcrumbs.map((node, idx) => {
        const isLast = idx === breadcrumbs.length - 1 && !currentFolderName;
        return (
          <React.Fragment key={node.id}>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            {isLast ? (
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 px-2 py-1">
                {node.name}
              </span>
            ) : (
              <Link
                href={`/dashboard/folders/${node.id}`}
                className="rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                {node.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}

      {currentFolderName && (
        <>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 px-2 py-1">
            {currentFolderName}
          </span>
        </>
      )}
    </nav>
  );
};
