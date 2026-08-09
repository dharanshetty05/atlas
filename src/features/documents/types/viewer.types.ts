import type { BreadcrumbNode, DocumentDTO } from "@/features/workspace/types";

/**
 * Minimal summary representation of an adjacent sibling document for navigation.
 */
export interface AdjacentDoc {
  id: string;
  title: string;
}

/**
 * Container holding immediate previous and next adjacent documents within the same folder.
 */
export interface AdjacentDocumentsDTO {
  prev: AdjacentDoc | null;
  next: AdjacentDoc | null;
}

/**
 * Context containing active document metadata along with its authorized content URL.
 */
export interface DocumentViewerContextDTO {
  document: DocumentDTO;
  readUrl: string;
}

/**
 * Complete hydration payload streamed from Server Component `page.tsx` to `DocumentViewerShell`.
 */
export interface DocumentViewerPayloadDTO {
  context: DocumentViewerContextDTO;
  breadcrumbs: BreadcrumbNode[];
  adjacent: AdjacentDocumentsDTO;
}

/**
 * Clean V1 UI State structure managed inside `DocumentViewerShell`.
 */
export interface ViewerUIState {
  activePage: number;
  totalPages: number;
  isMetadataOpen: boolean;
}
