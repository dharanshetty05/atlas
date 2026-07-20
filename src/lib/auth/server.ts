import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Retrieves the current Better Auth session from incoming request headers on the server.
 * Uses Better Auth's recommended `auth.api.getSession` with Next.js `headers()`.
 *
 * @returns The session and user object if authenticated, or null otherwise.
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Enforces server-side authentication for protected routes, layouts, or server actions.
 * If an authenticated session exists, returns the session data (`{ session, user }`).
 * If no valid session exists, immediately redirects to `/login` before rendering content.
 *
 * @returns The authenticated session and user object.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
