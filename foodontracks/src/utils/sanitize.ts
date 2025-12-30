/**
 * Input Sanitization Utilities
 *
 * Provides comprehensive protection against XSS (Cross-Site Scripting) attacks
 * by sanitizing user inputs before storing or rendering them.
 *
 * OWASP Best Practices:
 * - Never trust user input
 * - Sanitize all external data (forms, query params, headers)
 * - Use allowlists instead of blocklists
 * - Encode outputs when rendering
 */

import sanitizeHtml from "sanitize-html";
import validator from "validator";

/**
 * Sanitize HTML content - removes all potentially dangerous HTML tags and attributes
 *
 * Use cases:
 * - User comments
 * - Blog post content
 * - Any user-generated HTML
 *
 * @param input - Raw HTML string from user
 * @returns Sanitized HTML with only safe tags
 */
export function sanitizeHtmlInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return sanitizeHtml(input, {
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "u",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
    ],
    allowedAttributes: {},
    allowedIframeHostnames: [],
  });
}

/**
 * Strict sanitization - removes ALL HTML tags
 *
 * Use cases:
 * - Names, emails, phone numbers
 * - Search queries
 * - Any input that should be plain text only
 *
 * @param input - Raw string from user
 * @returns Plain text with no HTML tags
 */
export function sanitizeStrictInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Sanitize and validate email addresses
 *
 * @param email - Email address from user
 * @returns Sanitized and validated email, or null if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  // Remove whitespace and convert to lowercase
  const trimmed = email.trim().toLowerCase();

  if (!validator.isEmail(trimmed)) {
    return "";
  }

  // Normalize email (removes dots in Gmail, etc.)
  return validator.normalizeEmail(trimmed) || trimmed;
}

/**
 * Sanitize phone numbers
 *
 * @param phone - Phone number from user
 * @returns Sanitized phone number with only digits and + sign
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Keep only digits, +, and spaces
  return phone.replace(/[^\d+ ]/g, "").trim();
}

/**
 * Sanitize URL to prevent javascript: or data: injection
 *
 * @param url - URL from user
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("file:")
  ) {
    return "";
  }

  // Only allow http and https
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return "";
  }

  // Validate URL format
  if (
    !validator.isURL(url, {
      protocols: ["http", "https"],
      require_protocol: true,
    })
  ) {
    return "";
  }

  return url.trim();
}

/**
 * Sanitize SQL-like inputs to prevent injection
 * Note: This is a backup measure. Always use parameterized queries!
 *
 * @param input - User input that might be used in queries
 * @returns Escaped string
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove common SQL injection patterns
  const dangerous = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, // SQL comment chars
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi, // SQL equals
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, // OR keyword
    /((\%27)|(\'))union/gi, // UNION keyword
  ];

  let sanitized = input;
  dangerous.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized.trim();
}

/**
 * Sanitize object - recursively sanitize all string values
 *
 * @param obj - Object with user input
 * @returns Object with sanitized values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === "string") {
        sanitized[key] = sanitizeStrictInput(value);
      } else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        sanitized[key] = sanitizeObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: unknown) =>
          typeof item === "string" ? sanitizeStrictInput(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize file upload names
 *
 * @param filename - Original filename from upload
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "unnamed_file";
  }

  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, "");

  // Keep only safe characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Prevent hidden files
  if (safe.startsWith(".")) {
    safe = "file" + safe;
  }

  return safe;
}

/**
 * Rate limiting helper - check if input looks like spam/bot
 *
 * @param input - User input to check
 * @returns true if input looks suspicious
 */
export function isSuspiciousInput(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  const suspiciousPatterns = [
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers (onclick, onerror, etc.)
    /\beval\s*\(/i, // eval() calls
    /\bexec\s*\(/i, // exec() calls
    /<iframe/i, // iframe injection
    /\bselect\b.*\bfrom\b.*\bwhere\b/i, // SQL SELECT
    /\bunion\b.*\bselect\b/i, // SQL UNION
    /\bdrop\b.*\btable\b/i, // SQL DROP
    /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i, // OR 1=1
    /;\s*\w+/, // Stacked queries
    /%3[cC]script/i, // Encoded <script
    /&#\d+;.*script/i, // HTML entity encoded script
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitization report for logging/debugging
 *
 * @param original - Original input
 * @param sanitized - Sanitized output
 * @returns Report object
 */
export function getSanitizationReport(
  original: string,
  sanitized: string
): {
  wasSanitized: boolean;
  removedContent: boolean;
  suspicious: boolean;
  length: { before: number; after: number };
} {
  return {
    wasSanitized: original !== sanitized,
    removedContent: original.length > sanitized.length,
    suspicious: isSuspiciousInput(original),
    length: {
      before: original.length,
      after: sanitized.length,
    },
  };
}
