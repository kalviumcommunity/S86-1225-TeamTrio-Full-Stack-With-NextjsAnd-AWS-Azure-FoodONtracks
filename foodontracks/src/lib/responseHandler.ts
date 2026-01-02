/**
 * Standardized API Response Handlers for FoodONtracks
 * Provides consistent response formatting across all endpoints
 */

import { NextResponse } from "next/server";
import { ERROR_CODES, type ErrorCode } from "./errorCodes";

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send a success response with proper status code
 */
export function sendSuccess<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(createSuccessResponse(data, message), { status });
}

/**
 * Send an error response with proper status code
 */
export function sendError(
  code: ErrorCode,
  message: string,
  details?: unknown,
  status: number = 400
): NextResponse<ErrorResponse> {
  return NextResponse.json(createErrorResponse(code, message, details), {
    status,
  });
}

/**
 * Send a 404 Not Found response
 */
export function sendNotFound(
  resource: string = "Resource"
): NextResponse<ErrorResponse> {
  return sendError(
    ERROR_CODES.RESOURCE_NOT_FOUND,
    `${resource} not found`,
    undefined,
    404
  );
}

/**
 * Send a 401 Unauthorized response
 */
export function sendUnauthorized(
  message: string = "Unauthorized"
): NextResponse<ErrorResponse> {
  return sendError(ERROR_CODES.UNAUTHORIZED, message, undefined, 401);
}

/**
 * Send a 403 Forbidden response
 */
export function sendForbidden(
  message: string = "Insufficient permissions"
): NextResponse<ErrorResponse> {
  return sendError(
    ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    message,
    undefined,
    403
  );
}

/**
 * Send a 500 Internal Server Error response
 */
export function sendInternalError(
  message: string = "Internal server error",
  details?: unknown
): NextResponse<ErrorResponse> {
  return sendError(ERROR_CODES.INTERNAL_SERVER_ERROR, message, details, 500);
}

/**
 * Send a validation error response
 */
export function sendValidationError(
  message: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return sendError(ERROR_CODES.VALIDATION_ERROR, message, details, 400);
}
