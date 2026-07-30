"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchDocumentsAction } from "@/actions/document";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchResult } from "@/features/workspace/types";

interface DocumentSearchProps {
  workspaceId: string;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ workspaceId }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Perform search
  useEffect(() => {
    let isActive = true;
    const trimmedQuery = debouncedQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await searchDocumentsAction({ workspaceId, query: trimmedQuery });
      if (isActive) {
        if (res.success && res.data) {
          setResults(res.data);
        } else {
          setResults([]);
        }
        setIsOpen(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, workspaceId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/dashboard/documents/${id}`);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <label htmlFor="search" className="sr-only">Search documents</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search documents..."
          className="block w-full rounded-lg border border-neutral-200 bg-white/80 py-2 pl-10 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-all placeholder:text-neutral-400"
          autoComplete="off"
          maxLength={100}
          role="combobox"
          aria-expanded={isOpen && query.trim().length > 0}
          aria-controls="search-results"
          aria-haspopup="listbox"
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-4 w-4 animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {isOpen && query.trim() && (
        <div id="search-results" role="listbox" className="absolute mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900 z-50 py-1 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
          {!isPending && results.length === 0 ? (
            <div role="option" aria-disabled="true" className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
              No matching documents found.
            </div>
          ) : (
            results.map((doc) => (
              <button
                key={doc.id}
                type="button"
                role="option"
                onClick={() => handleSelect(doc.id)}
                className="w-full flex flex-col px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:bg-neutral-100 dark:focus:bg-neutral-800 outline-none"
              >
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate w-full">
                  {doc.title}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 w-full">
                  {doc.originalFilename}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
