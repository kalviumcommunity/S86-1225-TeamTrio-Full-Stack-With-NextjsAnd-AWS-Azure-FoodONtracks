import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/app/lib/responseHandler";

/**
 * GET /api/files/[id]
 * Retrieves a single file by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        createErrorResponse("Invalid file ID", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        createErrorResponse("File not found", "FILE_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(file, "File retrieved successfully"),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error retrieving file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      createErrorResponse(
        "Failed to retrieve file",
        "FILE_RETRIEVAL_FAILED",
        errorMessage
      ),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/files/[id]
 * Updates file metadata
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        createErrorResponse("Invalid file ID", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, entityType, entityId } = body;

    // Check if file exists
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!existingFile) {
      return NextResponse.json(
        createErrorResponse("File not found", "FILE_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Update file metadata
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        ...(name && { name }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId: parseInt(entityId.toString()) }),
      },
    });

    return NextResponse.json(
      createSuccessResponse(updatedFile, "File updated successfully"),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      createErrorResponse(
        "Failed to update file",
        "FILE_UPDATE_FAILED",
        errorMessage
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Deletes a file by ID
 * Note: This only deletes the database record, not the actual file from S3
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        createErrorResponse("Invalid file ID", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    // Check if file exists
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!existingFile) {
      return NextResponse.json(
        createErrorResponse("File not found", "FILE_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json(
      createSuccessResponse({ id: fileId }, "File deleted successfully"),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      createErrorResponse(
        "Failed to delete file",
        "FILE_DELETE_FAILED",
        errorMessage
      ),
      { status: 500 }
    );
  }
}
