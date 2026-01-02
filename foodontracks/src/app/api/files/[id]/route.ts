import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

/**
 * GET /api/files/[id]
 * Retrieves a single file by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid file ID",
        undefined,
        400
      );
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return sendError(
        ERROR_CODES.FILE_NOT_FOUND,
        "File not found",
        undefined,
        404
      );
    }

    return sendSuccess(file, "File retrieved successfully", 200);
  } catch (error: unknown) {
    console.error("Error retrieving file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to retrieve file",
      errorMessage,
      500
    );
  }
}

/**
 * PATCH /api/files/[id]
 * Updates file metadata
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid file ID",
        undefined,
        400
      );
    }

    const body = await req.json();
    const { name, entityType, entityId } = body;

    // Check if file exists
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!existingFile) {
      return sendError(
        ERROR_CODES.FILE_NOT_FOUND,
        "File not found",
        undefined,
        404
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

    return sendSuccess(updatedFile, "File updated successfully", 200);
  } catch (error: unknown) {
    console.error("Error updating file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to update file",
      errorMessage,
      500
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Deletes a file by ID
 * Note: This only deletes the database record, not the actual file from S3
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid file ID",
        undefined,
        400
      );
    }

    // Check if file exists
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!existingFile) {
      return sendError(
        ERROR_CODES.FILE_NOT_FOUND,
        "File not found",
        undefined,
        404
      );
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return sendSuccess({ id: fileId }, "File deleted successfully", 200);
  } catch (error: unknown) {
    console.error("Error deleting file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to delete file",
      errorMessage,
      500
    );
  }
}
