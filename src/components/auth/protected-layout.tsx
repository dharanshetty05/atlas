import { requireAuth } from "@/lib/auth/server";
import type { ReactNode } from "react";

/**
 * Reusable server-side layout wrapper for protected routes.
 * Enforces authentication on the server before rendering any child content.
 * Redirects unauthenticated users to `/login`.
 */
export async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
