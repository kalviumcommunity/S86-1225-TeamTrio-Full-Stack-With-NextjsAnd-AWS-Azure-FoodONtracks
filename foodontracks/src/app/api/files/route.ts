import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

/**
 * POST /api/files
 * Saves file metadata to database after successful upload
 *
 * Request Body:
 * - name: string (filename)
 * - url: string (file URL)
 * - fileType: string (MIME type)
 * - fileSize: number (size in bytes)
 * - uploaderId?: number (optional, user ID who uploaded)
 * - entityType?: string (optional, e.g., 'menu-item', 'restaurant')
 * - entityId?: number (optional, related entity ID)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, url, fileType, fileSize, uploaderId, entityType, entityId } =
      body;

    // Validate required fields
    if (!name || !url || !fileType || !fileSize) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required fields: name, url, fileType, and fileSize are required",
        undefined,
        400
      );
    }

    // Create file record in database
    const file = await prisma.file.create({
      data: {
        name,
        url,
        fileType,
        fileSize: parseInt(fileSize.toString()),
        uploaderId: uploaderId ? parseInt(uploaderId.toString()) : null,
        entityType: entityType || null,
        entityId: entityId ? parseInt(entityId.toString()) : null,
      },
    });

    return sendSuccess(file, "File metadata saved successfully", 201);
  } catch (error: unknown) {
    console.error("Error saving file metadata:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to save file metadata",
      errorMessage,
      500
    );
  }
}

/**
 * GET /api/files
 * Retrieves list of files with optional filters
 *
 * Query Parameters:
 * - entityType?: string (filter by entity type)
 * - entityId?: number (filter by entity ID)
 * - uploaderId?: number (filter by uploader)
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const uploaderId = searchParams.get("uploaderId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: {
      entityType?: string;
      entityId?: number;
      uploaderId?: number;
    } = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);
    if (uploaderId) where.uploaderId = parseInt(uploaderId);

    // Fetch files with pagination
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.file.count({ where }),
    ]);

    return sendSuccess(
      {
        files,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      "Files retrieved successfully",
      200
    );
  } catch (error: unknown) {
    console.error("Error retrieving files:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to retrieve files",
      errorMessage,
      500
    );
  }
}

/**
 * DELETE /api/files
 * Deletes multiple files by IDs
 *
 * Request Body:
 * - ids: number[] (array of file IDs to delete)
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing or invalid 'ids' field. Provide an array of file IDs.",
        undefined,
        400
      );
    }

    // Delete files from database
    const result = await prisma.file.deleteMany({
      where: {
        id: {
          in: ids.map((id) => parseInt(id.toString())),
        },
      },
    });

    return sendSuccess(
      { deletedCount: result.count },
      `Successfully deleted ${result.count} file(s)`,
      200
    );
  } catch (error: unknown) {
    console.error("Error deleting files:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to delete files",
      errorMessage,
      500
    );
  }
}
