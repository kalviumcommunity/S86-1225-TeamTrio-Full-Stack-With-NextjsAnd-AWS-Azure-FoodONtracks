/**
 * Validation Utilities for FoodONtracks
 * Provides data validation helpers using Zod schemas
 */

import { z } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

/**
 * Validate data against a Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        errors: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: error as z.ZodError,
    };
  }
}

/**
 * Format Zod validation errors for API responses
 */
export function formatValidationErrors(
  errors: z.ZodError
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(error.message);
  });

  return formatted;
}

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

/**
 * Sanitize string input (remove potentially harmful characters)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

/**
 * Validate and parse a positive integer
 */
export function parsePositiveInt(
  value: string | undefined,
  defaultValue?: number
): number | undefined {
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) return defaultValue;

  return parsed;
}

/**
 * Validate and parse a positive float
 */
export function parsePositiveFloat(
  value: string | undefined,
  defaultValue?: number
): number | undefined {
  if (!value) return defaultValue;

  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0) return defaultValue;

  return parsed;
}
