/**
 * File Upload Utility
 * Provides client-side file upload functionality using pre-signed URLs
 */

import { logger } from '@/lib/logger';

interface UploadOptions {
  filename: string;
  fileType: string;
  fileSize: number;
  entityType?: string;
  entityId?: number;
  uploaderId?: number;
  onProgress?: (progress: number) => void;
}

interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  fileId?: number;
  error?: string;
}

/**
 * Uploads a file to S3 using pre-signed URL
 * @param file File object to upload
 * @param options Upload options
 * @returns Upload response with file URL and ID
 */
export async function uploadFile(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResponse> {
  try {
    const uploadOptions: UploadOptions = {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      ...options,
    };

    // Step 1: Request pre-signed URL from backend
    const urlResponse = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: uploadOptions.filename,
        fileType: uploadOptions.fileType,
        fileSize: uploadOptions.fileSize,
        entityType: uploadOptions.entityType,
        entityId: uploadOptions.entityId,
      }),
    });

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json();
      return {
        success: false,
        error: errorData.message || "Failed to generate upload URL",
      };
    }

    const urlData = await urlResponse.json();
    const { uploadURL, publicURL, filename: generatedFilename } = urlData.data;

    // Step 2: Upload file directly to S3 using pre-signed URL
    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      headers: {
        "Content-Type": uploadOptions.fileType,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: "Failed to upload file to storage",
      };
    }

    // Step 3: Save file metadata to database
    const metadataResponse = await fetch("/api/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: generatedFilename,
        url: publicURL,
        fileType: uploadOptions.fileType,
        fileSize: uploadOptions.fileSize,
        uploaderId: uploadOptions.uploaderId,
        entityType: uploadOptions.entityType,
        entityId: uploadOptions.entityId,
      }),
    });

    if (!metadataResponse.ok) {
      logger.warn("upload_metadata_save_failed", { context: { filename: generatedFilename } });
      return {
        success: true,
        fileUrl: publicURL,
        error: "File uploaded but metadata not saved",
      };
    }

    const metadataData = await metadataResponse.json();

    return {
      success: true,
      fileUrl: publicURL,
      fileId: metadataData.data.id,
    };
  } catch (error: unknown) {
    logger.error("upload_error", { error: error instanceof Error ? error.message : String(error) });
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during upload";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Uploads multiple files sequentially
 * @param files Array of files to upload
 * @param options Upload options (applied to all files)
 * @returns Array of upload responses
 */
export async function uploadMultipleFiles(
  files: File[],
  options: Partial<UploadOptions> = {}
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];

  for (const file of files) {
    const result = await uploadFile(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Validates file before upload
 * @param file File to validate
 * @param maxSizeMB Maximum file size in MB (default: 10)
 * @param allowedTypes Allowed MIME types
 * @returns Validation result
 */
export function validateFileBeforeUpload(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type if specified
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Gets upload configuration from server
 * @returns Upload configuration
 */
export async function getUploadConfig() {
  try {
    const response = await fetch("/api/upload");
    if (!response.ok) {
      throw new Error("Failed to fetch upload configuration");
    }
    const data = await response.json();
    return data.data;
  } catch (error: unknown) {
    logger.error("upload_config_fetch_error", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Deletes a file by ID
 * @param fileId File ID to delete
 * @returns Success status
 */
export async function deleteFile(fileId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    logger.error("upload_delete_error", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Gets file metadata by ID
 * @param fileId File ID
 * @returns File metadata
 */
export async function getFileMetadata(fileId: number) {
  try {
    const response = await fetch(`/api/files/${fileId}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    logger.error("upload_metadata_fetch_error", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}
