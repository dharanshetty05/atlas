"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
            router.push("/login");
          },
          onError: () => {
            setIsLoggingOut(false);
          },
        },
      });
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus:ring-neutral-100/20"
    >
      {isLoggingOut ? "Signing out..." : "Logout"}
    </button>
  );
}
