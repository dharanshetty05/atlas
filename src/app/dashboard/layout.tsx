import { requireAuth } from "@/lib/auth/server";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAuth();
  const overview = await workspaceService.getWorkspaceOverview(user.id);
  const tree = await navigationService.getFolderTree(overview.workspace.id);

  return (
    <WorkspaceShell
      tree={tree}
      overview={overview}
      userName={user.name ?? "Atlas User"}
      userEmail={user.email}
    >
      {children}
    </WorkspaceShell>
  );
}
