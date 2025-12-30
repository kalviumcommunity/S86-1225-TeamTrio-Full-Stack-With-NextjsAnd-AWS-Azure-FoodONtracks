/**
 * Security Headers Utility
 * Provides functions to set security-related headers in API responses
 * Complements next.config.ts headers configuration
 */

import { NextResponse } from "next/server";

export interface SecurityHeadersOptions {
  addCSPNonce?: boolean;
  customHeaders?: Record<string, string>;
}

/**
 * Security headers that should be set on every API response
 * These complement the headers configured in next.config.ts
 */
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Prevent clickjacking
  "X-Frame-Options": "SAMEORIGIN",

  // Enable XSS protection in older browsers
  "X-XSS-Protection": "1; mode=block",

  // Control how much referrer information is shared
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Remove sensitive information in error pages
  "X-Powered-By": "Next.js",

  // Cache control for sensitive routes
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",

  // Prevent CORP (Cross-Origin Resource Policy) attacks
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * Apply security headers to NextResponse
 * Use in API routes to ensure all responses include security headers
 */
export function applySecurityHeaders(
  response: NextResponse | Response,
  options: SecurityHeadersOptions = {}
): NextResponse | Response {
  // Apply standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply custom headers if provided
  if (options.customHeaders) {
    Object.entries(options.customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Create a secure JSON response with security headers applied
 */
export function secureJsonResponse(
  data: any,
  status: number = 200,
  options: SecurityHeadersOptions = {}
): NextResponse {
  const response = NextResponse.json(data, { status });
  return applySecurityHeaders(response, options) as NextResponse;
}

/**
 * Create a secure error response with security headers
 */
export function secureErrorResponse(
  message: string,
  status: number = 500,
  options: SecurityHeadersOptions = {}
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
  return applySecurityHeaders(response, options) as NextResponse;
}

/**
 * Generate a CSP nonce for inline scripts
 * This allows inline scripts while still maintaining CSP protection
 */
export function generateCSPNonce(): string {
  if (typeof global !== "undefined" && (global as any).__CSP_NONCE__) {
    return (global as any).__CSP_NONCE__;
  }

  // Generate a random nonce
  const nonce = Buffer.from(Math.random().toString()).toString("base64");

  if (typeof global !== "undefined") {
    (global as any).__CSP_NONCE__ = nonce;
  }

  return nonce;
}

/**
 * Verify that a response is secure (has proper headers)
 * Useful for testing
 */
export function verifySecurityHeaders(
  headers: Headers | Record<string, string>
): {
  isSecure: boolean;
  missingHeaders: string[];
  presentHeaders: string[];
} {
  const requiredHeaders = Object.keys(SECURITY_HEADERS);
  const presentHeaders: string[] = [];
  const missingHeaders: string[] = [];

  requiredHeaders.forEach((header) => {
    if (headers instanceof Headers) {
      if (headers.has(header)) {
        presentHeaders.push(header);
      } else {
        missingHeaders.push(header);
      }
    } else {
      if (header in headers) {
        presentHeaders.push(header);
      } else {
        missingHeaders.push(header);
      }
    }
  });

  return {
    isSecure: missingHeaders.length === 0,
    missingHeaders,
    presentHeaders,
  };
}
