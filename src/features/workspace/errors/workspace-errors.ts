export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WorkspaceNotFoundError extends DomainError {
  readonly code = "WORKSPACE_NOT_FOUND";
  readonly statusCode = 404;

  constructor(workspaceId?: string) {
    super(
      workspaceId
        ? `Workspace '${workspaceId}' not found.`
        : "No personal workspace found for this user."
    );
  }
}

export class FolderNotFoundError extends DomainError {
  readonly code = "FOLDER_NOT_FOUND";
  readonly statusCode = 404;

  constructor(folderId?: string) {
    super(
      folderId
        ? `Folder '${folderId}' not found or has been deleted.`
        : "Folder not found."
    );
  }
}

export class DocumentNotFoundError extends DomainError {
  readonly code = "DOCUMENT_NOT_FOUND";
  readonly statusCode = 404;

  constructor(documentId?: string) {
    super(
      documentId
        ? `Document '${documentId}' not found or has been deleted.`
        : "Document not found."
    );
  }
}

export class DuplicateFolderNameError extends DomainError {
  readonly code = "DUPLICATE_FOLDER_NAME";
  readonly statusCode = 409;

  constructor(name: string) {
    super(`A folder named '${name}' already exists in this destination.`);
  }
}

export class CircularFolderMoveError extends DomainError {
  readonly code = "CIRCULAR_FOLDER_MOVE";
  readonly statusCode = 400;

  constructor() {
    super("Cannot move a folder into its own child or descendant.");
  }
}

export class MaxFolderDepthExceededError extends DomainError {
  readonly code = "MAX_FOLDER_DEPTH_EXCEEDED";
  readonly statusCode = 400;

  constructor(maxDepth: number) {
    super(`Folder hierarchy cannot exceed ${maxDepth} nested levels.`);
  }
}

export class UnauthorizedWorkspaceAccessError extends DomainError {
  readonly code = "UNAUTHORIZED_WORKSPACE_ACCESS";
  readonly statusCode = 403;

  constructor() {
    super("You do not have permission to access resources in this workspace.");
  }
}

export class InvalidDocumentFileError extends DomainError {
  readonly code = "INVALID_DOCUMENT_FILE";
  readonly statusCode = 400;

  constructor(reason: string) {
    super(`Invalid document file: ${reason}`);
  }
}
