import { ZodError, ZodSchema } from "zod";
import { NextResponse } from "next/server";

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string | number;
    message: string;
  }>;
}

export interface ValidatedDataResponse<T> {
  success: true;
  data: T;
}

/**
 * Validates data against a Zod schema and returns structured response
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and either validated data or errors
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidatedDataResponse<T> | ValidationErrorResponse {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated as T,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Validation Error",
        errors: error.errors.map((err) => ({
          field: err.path[0] ?? "unknown",
          message: err.message,
        })),
      };
    }

    return {
      success: false,
      message: "An unexpected validation error occurred",
      errors: [{ field: "unknown", message: String(error) }],
    };
  }
}

/**
 * Validates data and returns appropriate HTTP response
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns NextResponse with validation result or error
 */
export async function validateAndRespond<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<NextResponse> {
  const result = validateData<T>(schema, data);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
    },
    { status: 200 }
  );
}

/**
 * Safely parses JSON from request
 * @param req - Request object
 * @returns Parsed JSON or null if parsing fails
 */
export async function safeJsonParse(
  req: Request
): Promise<unknown | null> {
  try {
    return await req.json();
  } catch (error) {
    return null;
  }
}
