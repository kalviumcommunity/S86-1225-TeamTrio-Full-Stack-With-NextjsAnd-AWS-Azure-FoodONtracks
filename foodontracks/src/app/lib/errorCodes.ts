// lib/errorCodes.ts

/**
 * Standardized Error Codes
 *
 * Centralized error code definitions for consistent error handling
 * across all API endpoints. Each code represents a specific error category
 * and can be used for programmatic error handling on the frontend.
 *
 * Error Code Format: E[Category][Number]
 * - E001-E099: Validation errors
 * - E100-E199: Authentication/Authorization errors
 * - E200-E299: Resource not found errors
 * - E300-E399: Database operation errors
 * - E400-E499: Business logic errors
 * - E500-E599: Internal server errors
 */

export const ERROR_CODES = {
  // Validation Errors (E001-E099)
  VALIDATION_ERROR: "E001",
  MISSING_REQUIRED_FIELD: "E002",
  INVALID_FORMAT: "E003",
  INVALID_EMAIL: "E004",
  INVALID_PHONE: "E005",
  INVALID_DATE: "E006",
  INVALID_ID: "E007",
  INVALID_QUANTITY: "E008",
  INVALID_PRICE: "E009",

  // Authentication/Authorization Errors (E100-E199)
  UNAUTHORIZED: "E100",
  FORBIDDEN: "E101",
  INVALID_TOKEN: "E102",
  TOKEN_EXPIRED: "E103",
  INVALID_CREDENTIALS: "E104",

  // Resource Not Found Errors (E200-E299)
  NOT_FOUND: "E200",
  USER_NOT_FOUND: "E201",
  RESTAURANT_NOT_FOUND: "E202",
  MENU_ITEM_NOT_FOUND: "E203",
  ORDER_NOT_FOUND: "E204",
  ADDRESS_NOT_FOUND: "E205",
  DELIVERY_PERSON_NOT_FOUND: "E206",
  REVIEW_NOT_FOUND: "E207",

  // Database Operation Errors (E300-E399)
  DATABASE_FAILURE: "E300",
  DATABASE_CONNECTION_ERROR: "E301",
  QUERY_FAILED: "E302",
  TRANSACTION_FAILED: "E303",
  CONSTRAINT_VIOLATION: "E304",
  DUPLICATE_ENTRY: "E305",

  // Business Logic Errors (E400-E499)
  INSUFFICIENT_STOCK: "E400",
  ORDER_ALREADY_COMPLETED: "E401",
  ORDER_ALREADY_CANCELLED: "E402",
  INVALID_ORDER_STATUS: "E403",
  RESTAURANT_CLOSED: "E404",
  MINIMUM_ORDER_NOT_MET: "E405",
  DELIVERY_PERSON_UNAVAILABLE: "E406",

  // Internal Server Errors (E500-E599)
  INTERNAL_ERROR: "E500",
  SERVICE_UNAVAILABLE: "E501",
  EXTERNAL_API_ERROR: "E502",
  UNKNOWN_ERROR: "E599",
} as const;

/**
 * Type-safe error code type
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Error code descriptions for documentation and logging
 */
export const ERROR_DESCRIPTIONS: Record<ErrorCode, string> = {
  // Validation Errors
  E001: "General validation error",
  E002: "Required field is missing",
  E003: "Invalid format provided",
  E004: "Invalid email format",
  E005: "Invalid phone number format",
  E006: "Invalid date format",
  E007: "Invalid ID format or value",
  E008: "Invalid quantity value",
  E009: "Invalid price value",

  // Authentication/Authorization Errors
  E100: "User is not authenticated",
  E101: "User does not have permission",
  E102: "Invalid authentication token",
  E103: "Authentication token has expired",
  E104: "Invalid username or password",

  // Resource Not Found Errors
  E200: "Requested resource not found",
  E201: "User not found",
  E202: "Restaurant not found",
  E203: "Menu item not found",
  E204: "Order not found",
  E205: "Address not found",
  E206: "Delivery person not found",
  E207: "Review not found",

  // Database Operation Errors
  E300: "Database operation failed",
  E301: "Cannot connect to database",
  E302: "Database query execution failed",
  E303: "Transaction rollback occurred",
  E304: "Database constraint violation",
  E305: "Duplicate entry detected",

  // Business Logic Errors
  E400: "Insufficient stock available",
  E401: "Order is already completed",
  E402: "Order is already cancelled",
  E403: "Invalid order status transition",
  E404: "Restaurant is currently closed",
  E405: "Minimum order amount not met",
  E406: "No delivery person available",

  // Internal Server Errors
  E500: "Internal server error occurred",
  E501: "Service temporarily unavailable",
  E502: "External API request failed",
  E599: "An unknown error occurred",
};

/**
 * Get error description by code
 */
export const getErrorDescription = (code: string): string => {
  return ERROR_DESCRIPTIONS[code as ErrorCode] || ERROR_DESCRIPTIONS.E599;
};
