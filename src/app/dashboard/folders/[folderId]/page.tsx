import { requireAuth } from "@/lib/auth/server";
import { folderService } from "@/features/workspace/services/folder.service";
import { navigationService } from "@/features/workspace/services/navigation.service";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import { Breadcrumbs } from "@/features/workspace/components/breadcrumbs";
import { FolderGrid } from "@/features/workspace/components/folder-grid";
import { notFound } from "next/navigation";

interface FolderPageProps {
  params: Promise<{ folderId: string }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { folderId } = await params;
  const { user } = await requireAuth();
  const overview = await workspaceService.getWorkspaceOverview(user.id);

  try {
    const [contents, tree] = await Promise.all([
      folderService.listDirectChildren(overview.workspace.id, folderId),
      navigationService.getFolderTree(overview.workspace.id),
    ]);

    return (
      <div className="space-y-6">
        <Breadcrumbs
          breadcrumbs={contents.breadcrumbs}
          currentFolderName={contents.currentFolder?.name ?? "Folder"}
        />
        <FolderGrid contents={contents} workspaceId={overview.workspace.id} folderTree={tree} />
      </div>
    );
  } catch {
    notFound();
  }
}
