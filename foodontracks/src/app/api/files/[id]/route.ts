import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { File } from "@/models/File";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { logger } from "@/lib/logger";

/**
 * GET /api/files/[id]
 * Retrieves a single file by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const file = await File.findById(id);

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
    logger.error("error_retrieving_file", { error: String(error) });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to retrieve file",
      errorMessage,
      500
    );
  }
}
