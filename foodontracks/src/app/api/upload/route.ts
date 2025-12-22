import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, AWS_BUCKET_NAME } from "@/app/lib/s3Client";
import {
  validateFile,
  generateUniqueFilename,
  MAX_FILE_SIZE,
} from "@/app/lib/fileValidation";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/app/lib/responseHandler";

/**
 * POST /api/upload
 * Generates a pre-signed URL for direct file upload to S3
 *
 * Request Body:
 * - filename: string (original filename)
 * - fileType: string (MIME type)
 * - fileSize: number (file size in bytes)
 * - entityType?: string (optional, e.g., 'menu-item', 'restaurant')
 * - entityId?: number (optional, related entity ID)
 *
 * Response:
 * - uploadURL: string (pre-signed URL for upload)
 * - fileKey: string (S3 key for the file)
 * - publicURL: string (public URL after upload)
 * - expiresIn: number (URL expiry time in seconds)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, fileType, fileSize, entityType, entityId } = body;

    // Validate required fields
    if (!filename || !fileType || !fileSize) {
      return NextResponse.json(
        createErrorResponse(
          "Missing required fields: filename, fileType, and fileSize are required",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateFile(fileType, fileSize);
    if (!validation.valid) {
      return NextResponse.json(
        createErrorResponse(
          validation.error || "File validation failed",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // Validate file size doesn't exceed limit
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        createErrorResponse(
          `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          "FILE_TOO_LARGE"
        ),
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(filename);

    // Create folder structure based on entity type
    const folder = entityType ? `${entityType}/` : "uploads/";
    const fileKey = `${folder}${uniqueFilename}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      // Add metadata
      Metadata: {
        originalFilename: filename,
        entityType: entityType || "general",
        entityId: entityId?.toString() || "none",
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate pre-signed URL with 60 seconds expiry
    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: 60, // URL expires in 60 seconds
    });

    // Construct public URL (adjust based on your S3 bucket configuration)
    const publicURL = `https://${AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return NextResponse.json(
      createSuccessResponse(
        {
          uploadURL,
          fileKey,
          publicURL,
          expiresIn: 60,
          filename: uniqueFilename,
        },
        "Pre-signed URL generated successfully"
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error generating pre-signed URL:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      createErrorResponse(
        "Failed to generate pre-signed URL",
        "UPLOAD_URL_GENERATION_FAILED",
        errorMessage
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Returns upload configuration and limits
 */
export async function GET() {
  try {
    return NextResponse.json(
      createSuccessResponse(
        {
          maxFileSize: MAX_FILE_SIZE,
          maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
          allowedTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
          ],
          urlExpirySeconds: 60,
          bucketName: AWS_BUCKET_NAME,
          region: process.env.AWS_REGION,
        },
        "Upload configuration retrieved successfully"
      ),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "Failed to retrieve upload configuration",
        "CONFIG_ERROR"
      ),
      { status: 500 }
    );
  }
}
