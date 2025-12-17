// lib/responseHandler.ts
import { NextResponse } from "next/server";

/**
 * Standard API Response Format
 *
 * This module provides a unified response structure for all API endpoints,
 * ensuring consistency and predictability across the application.
 *
 * Success Response:
 * {
 *   success: true,
 *   message: string,
 *   data: any,
 *   timestamp: string
 * }
 *
 * Error Response:
 * {
 *   success: false,
 *   message: string,
 *   error: { code: string, details?: any },
 *   timestamp: string
 * }
 */

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Send a standardized success response
 *
 * @param data - The payload to return to the client
 * @param message - A human-readable success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized success format
 *
 * @example
 * return sendSuccess(users, "Users fetched successfully");
 * return sendSuccess(newUser, "User created successfully", 201);
 */
export const sendSuccess = <T = unknown>(
  data: T,
  message = "Success",
  status = 200
): NextResponse<SuccessResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

/**
 * Send a standardized error response
 *
 * @param message - A human-readable error message
 * @param code - An error code for programmatic handling (default: "INTERNAL_ERROR")
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error details
 * @returns NextResponse with standardized error format
 *
 * @example
 * return sendError("User not found", "NOT_FOUND", 404);
 * return sendError("Invalid email format", "VALIDATION_ERROR", 400);
 * return sendError("Database connection failed", "DATABASE_FAILURE", 500, err);
 */
export const sendError = (
  message = "Something went wrong",
  code = "INTERNAL_ERROR",
  status = 500,
  details?: unknown
): NextResponse<ErrorResponse> => {
  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        code,
        details: details
          ? typeof details === "object" &&
            details !== null &&
            "message" in details
            ? (details as { message: string }).message
            : details
          : undefined,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

/**
 * Utility function to handle common try-catch patterns
 *
 * @param handler - Async function that returns data or throws an error
 * @param successMessage - Message to return on success
 * @param errorMessage - Message to return on error
 * @param errorCode - Error code to use on failure
 * @returns Promise of NextResponse
 *
 * @example
 * return handleAPIRoute(
 *   async () => await prisma.user.findMany(),
 *   "Users fetched successfully",
 *   "Failed to fetch users",
 *   "USER_FETCH_ERROR"
 * );
 */
export const handleAPIRoute = async <T = unknown>(
  handler: () => Promise<T>,
  successMessage: string,
  errorMessage: string,
  errorCode: string
): Promise<NextResponse> => {
  try {
    const data = await handler();
    return sendSuccess(data, successMessage);
  } catch (error) {
    console.error(`[${errorCode}] ${errorMessage}:`, error);
    return sendError(errorMessage, errorCode, 500, error);
  }
};
