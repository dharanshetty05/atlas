import { requireAuth } from "@/lib/auth/server";
import { folderService } from "@/features/workspace/services/folder.service";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import { Breadcrumbs } from "@/features/workspace/components/breadcrumbs";
import { FolderGrid } from "@/features/workspace/components/folder-grid";

export default async function DashboardPage() {
  const { user } = await requireAuth();
  const overview = await workspaceService.getWorkspaceOverview(user.id);

  const [contents, tree] = await Promise.all([
    folderService.listDirectChildren(overview.workspace.id, null),
    navigationService.getFolderTree(overview.workspace.id),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={[]} currentFolderName={null} />
      <FolderGrid contents={contents} workspaceId={overview.workspace.id} folderTree={tree} />
    </div>
  );
}
