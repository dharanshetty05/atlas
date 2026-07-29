import type { DocumentStatus } from "@prisma/client";

export interface BreadcrumbNode {
  id: string;
  name: string;
}

export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderTreeNode[];
}

export interface FolderDTO {
  id: string;
  name: string;
  workspaceId: string;
  ownerId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface DocumentDTO {
  id: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSize: string; // Serialized as string for JSON/client transport since BigInt is not JSON serializable
  storageKey: string;
  status: DocumentStatus;
  folderId: string | null;
  workspaceId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkspaceOverviewDTO {
  workspace: {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  folderCount: number;
  documentCount: number;
}

export interface FolderContentsDTO {
  currentFolder: FolderDTO | null;
  breadcrumbs: BreadcrumbNode[];
  folders: FolderDTO[];
  documents: DocumentDTO[];
}

export interface SearchResult {
  id: string;
  title: string;
  originalFilename: string;
  folderId: string | null;
  updatedAt: Date;
}
