// File validation utilities

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum file size for images: 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Validates file type
 * @param fileType MIME type of the file
 * @param allowedTypes Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export function validateFileType(
  fileType: string,
  allowedTypes: string[] = ALLOWED_FILE_TYPES
): boolean {
  return allowedTypes.includes(fileType);
}

/**
 * Validates file size
 * @param fileSize Size of the file in bytes
 * @param maxSize Maximum allowed size in bytes
 * @returns true if valid, false otherwise
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number = MAX_FILE_SIZE
): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

/**
 * Generates a unique filename with timestamp and random string
 * @param originalFilename Original filename
 * @returns Sanitized unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedName = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
  const extension = sanitizedName.split(".").pop();
  const nameWithoutExt = sanitizedName.replace(`.${extension}`, "");

  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Gets file extension from filename
 * @param filename Filename with extension
 * @returns File extension without dot
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop() || "";
}

/**
 * Validates image file specifically
 * @param fileType MIME type
 * @param fileSize File size in bytes
 * @returns Validation result with message
 */
export function validateImageFile(
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!validateFileType(fileType, ALLOWED_IMAGE_TYPES)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  if (!validateFileSize(fileSize, MAX_IMAGE_SIZE)) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validates document file specifically
 * @param fileType MIME type
 * @param fileSize File size in bytes
 * @returns Validation result with message
 */
export function validateDocumentFile(
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!validateFileType(fileType, ALLOWED_DOCUMENT_TYPES)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
    };
  }

  if (!validateFileSize(fileSize, MAX_FILE_SIZE)) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validates any allowed file type
 * @param fileType MIME type
 * @param fileSize File size in bytes
 * @returns Validation result with message
 */
export function validateFile(
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!validateFileType(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
    };
  }

  if (!validateFileSize(fileSize)) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}
