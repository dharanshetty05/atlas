"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { FolderTree } from "@/features/workspace/components/folder-tree";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import type { FolderTreeNode, WorkspaceOverviewDTO } from "@/features/workspace/types";

interface WorkspaceShellProps {
  children: React.ReactNode;
  tree: FolderTreeNode[];
  overview: WorkspaceOverviewDTO;
  userName: string;
  userEmail: string;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  children,
  tree,
  overview,
  userName,
  userEmail,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200/80 bg-white/90 backdrop-blur-md transition-transform duration-300 dark:border-neutral-800/80 dark:bg-neutral-900/90 lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200/80 px-5 dark:border-neutral-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/20 font-black tracking-tight">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Atlas <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Knowledge</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
          <FolderTree tree={tree} />
        </div>

        <div className="px-4 py-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <Link
            href="/dashboard/activity"
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
          >
            <svg className="h-4 w-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity History
          </Link>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-neutral-200/80 p-4 dark:border-neutral-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {userName}
                </p>
                <p className="truncate text-[11px] text-neutral-400">{userEmail}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-4 dark:border-neutral-800/80 dark:bg-neutral-900 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">Atlas</span>
          <div className="w-6" />
        </div>

        {/* Workspace Header */}
        <WorkspaceHeader overview={overview} />

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
};
