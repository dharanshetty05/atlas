import { LogoutButton } from "@/components/auth/logout-button";
import { requireAuth } from "@/lib/auth/server";

export default async function DashboardPage() {
  const { user } = await requireAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Welcome back, <span className="font-medium text-neutral-900 dark:text-neutral-100">{user.name}</span>
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}

