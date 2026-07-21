import React, { type ReactNode } from "react";

export default function DocumentViewerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="-m-4 md:-m-6 lg:-m-8 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950">
      {children}
    </div>
  );
}
