import { folderService } from './src/features/workspace/services/folder.service';
import { navigationService } from './src/features/workspace/services/navigation.service';
import { db } from './src/lib/db';

async function measure() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    console.log("No workspace found");
    return;
  }
  const workspaceId = workspace.id;

  const contents = await folderService.listDirectChildren(workspaceId, null);
  const folderTree = await navigationService.getFolderTree(workspaceId);

  const contentsSize = Buffer.byteLength(JSON.stringify(contents), 'utf8');
  const treeSize = Buffer.byteLength(JSON.stringify(folderTree), 'utf8');

  console.log(`WorkspaceId size: ${Buffer.byteLength(JSON.stringify(workspaceId), 'utf8')} bytes`);
  console.log(`Contents size: ${contentsSize} bytes`);
  console.log(`FolderTree size: ${treeSize} bytes`);
  
  if (contentsSize > 1000000 || treeSize > 1000000) {
    console.log("Found an object exceeding 1MB!");
  } else {
    console.log("None exceed 1MB in this generic test.");
  }

  process.exit(0);
}

measure().catch(console.error);
