import { NextResponse } from "next/server";

import { documentService } from "@/features/workspace/services/document.service";
import {
  DocumentNotFoundError,
  DomainError,
} from "@/features/workspace/errors/workspace-errors";
import { workspaceService } from "@/features/workspace/services/workspace.service";
import { storageService } from "@/features/uploads/services/storage.service";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

interface DocumentContentRouteProps {
  params: Promise<{ documentId: string }>;
}

function buildContentDisposition(
  disposition: "inline" | "attachment",
  originalFilename: string
): string {
  const encodedFilename = encodeURIComponent(originalFilename);
  const type = disposition === "attachment" ? "attachment" : "inline";
  return `${type}; filename="${originalFilename.replace(/"/g, "")}"; filename*=UTF-8''${encodedFilename}`;
}

export async function GET(request: Request, { params }: DocumentContentRouteProps) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const url = new URL(request.url);
  const disposition =
    url.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

  try {
    const overview = await workspaceService.getWorkspaceOverview(session.user.id);
    const workspaceId = overview.workspace.id;

    const document = await documentService.getDocumentById(workspaceId, documentId);

    const object = await storageService.getObjectStream(document.storageKey);

    return new NextResponse(object.stream as unknown as BodyInit, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(object.size),
        "Content-Disposition": buildContentDisposition(
          disposition,
          document.originalFilename
        ),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (error instanceof Error && error.message.includes("Storage object not found")) {
      return NextResponse.json({ error: "Document file not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while retrieving document content." },
      { status: 500 }
    );
  }
}
