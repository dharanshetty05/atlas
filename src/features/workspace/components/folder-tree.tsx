"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FolderTreeNode } from "@/features/workspace/types";

interface FolderTreeProps {
  tree: FolderTreeNode[];
  currentFolderId?: string | null;
}

const TreeNode: React.FC<{
  node: FolderTreeNode;
  currentFolderId?: string | null;
  depth: number;
}> = ({ node, currentFolderId, depth }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const pathname = usePathname();
  const isSelected = currentFolderId === node.id || pathname === `/dashboard/folders/${node.id}`;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-all duration-150 ${
          isSelected
            ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
        }`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
      >
        <Link
          href={`/dashboard/folders/${node.id}`}
          className="flex flex-1 items-center gap-2.5 overflow-hidden text-left"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-200/60 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 group-hover:scale-105 transition-transform">
            <svg className="h-3.5 w-3.5 fill-current text-amber-500" viewBox="0 0 24 24">
              <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
            </svg>
          </span>
          <span className="truncate">{node.name}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-200/50 hover:text-neutral-600 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-200 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-3 w-3 transform transition-transform duration-150 ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5 border-l border-neutral-200/70 ml-3.5 pl-0.5 dark:border-neutral-800">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              currentFolderId={currentFolderId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ tree, currentFolderId }) => {
  const pathname = usePathname();
  const isAtRoot = pathname === "/dashboard" && !currentFolderId;

  return (
    <nav className="space-y-1.5 p-3">
      <Link
        href="/dashboard"
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
          isAtRoot
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
        }`}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Workspace Home</span>
      </Link>

      <div className="pt-2">
        <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Folders
        </div>
        {tree.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
            No folders yet. Create one below!
          </div>
        ) : (
          <div className="space-y-0.5">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} currentFolderId={currentFolderId} depth={0} />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
