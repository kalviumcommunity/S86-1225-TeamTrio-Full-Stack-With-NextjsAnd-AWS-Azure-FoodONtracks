
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { File } from "@/models/File";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
 

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
export const POST = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, url, fileType, fileSize, uploaderId } =
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
    const file = await File.create({
      filename: name,
      originalName: name,
      mimeType: fileType,
      size: parseInt(fileSize.toString()),
      cloudinaryUrl: url,
      uploadedBy: uploaderId as any,
    });

    return sendSuccess(file, "File metadata saved successfully", 201);
  } catch (error: unknown) {
    logger.error("error_saving_file_metadata", { error: String(error) });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to save file metadata",
      errorMessage,
      500
    );
  }
});

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
export const GET = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const uploaderId = searchParams.get("uploaderId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filter
    const filter: any = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = parseInt(entityId);
    if (uploaderId) filter.uploaderId = uploaderId;

    // Fetch files with pagination
    const [files, total] = await Promise.all([
      File.find(filter)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 })
        .lean(),
      File.countDocuments(filter),
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
    logger.error("error_retrieving_files", { error: String(error) });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to retrieve files",
      errorMessage,
      500
    );
  }
});

/**
 * DELETE /api/files
 * Deletes multiple files by IDs
 *
 * Request Body:
 * - ids: number[] (array of file IDs to delete)
 */
export const DELETE = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
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
    const result = await File.deleteMany({
      _id: { $in: ids }
    });

    return sendSuccess(
      { deletedCount: result.deletedCount },
      `Successfully deleted ${result.deletedCount} file(s)`,
      200
    );
  } catch (error: unknown) {
    logger.error("error_deleting_files", { error: String(error) });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to delete files",
      errorMessage,
      500
    );
  }
});
