/**
 * CORS Headers Utility
 * Provides secure CORS configuration for API routes
 */

export interface CORSOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_OPTIONS: CORSOptions = {
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Get secure CORS configuration based on environment
 * Production: Only allow specific trusted domains
 * Development: Allow localhost variants
 */
export function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === "production") {
    // Define your production domains here
    return [
      process.env.NEXT_PUBLIC_APP_URL || "https://foodontracks.com",
      ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
    ].filter(Boolean);
  }

  // Development: Allow localhost and common dev URLs
  return [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:5000",
    "http://localhost:8000",
  ];
}

/**
 * Set CORS headers on response
 * Validates origin against allowed list
 */
export function setCORSHeaders(
  origin: string | null,
  options: CORSOptions = {}
): Record<string, string> {
  const mergedOptions = { ...DEFAULT_CORS_OPTIONS, ...options };
  const allowedOrigins = getAllowedOrigins();

  // Validate origin
  const isOriginAllowed = origin && allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": mergedOptions.allowedMethods?.join(", ") || "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": mergedOptions.allowedHeaders?.join(", ") || "Content-Type, Authorization",
    "Access-Control-Max-Age": String(mergedOptions.maxAge || 86400),
  };

  // Only set Origin if it's allowed (never use '*' for credentials)
  if (isOriginAllowed && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    if (mergedOptions.credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }
  }

  // Expose additional headers if needed
  headers["Access-Control-Expose-Headers"] = "Content-Length, X-JSON-Response-Size";

  return headers;
}

/**
 * Handle preflight OPTIONS requests
 * Returns 200 with CORS headers for browser preflight
 */
export function handleCORSPreflight(
  origin: string | null,
  options: CORSOptions = {}
): Response {
  const headers = setCORSHeaders(origin, options);
  return new Response(null, {
    status: 200,
    headers: {
      ...headers,
      "Content-Length": "0",
    },
  });
}

/**
 * Check if origin is allowed (useful for conditional logic)
 */
export function isOriginAllowed(origin: string): boolean {
  return getAllowedOrigins().includes(origin);
}
