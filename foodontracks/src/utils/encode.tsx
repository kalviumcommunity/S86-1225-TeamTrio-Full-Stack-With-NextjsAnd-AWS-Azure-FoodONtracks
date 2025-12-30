/**
 * Output Encoding Utilities
 *
 * Provides safe output encoding for client-side rendering
 * to prevent XSS attacks even if sanitization is bypassed.
 *
 * Defense in Depth: Sanitize on input AND encode on output
 */

"use client";

import DOMPurify from "isomorphic-dompurify";

/**
 * Safely render HTML content in React components
 * Use this instead of dangerouslySetInnerHTML
 *
 * @param html - HTML string to render
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeForRender(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
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
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "img",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strict sanitization for rendering - removes ALL tags
 *
 * @param html - HTML string
 * @returns Plain text only
 */
export function sanitizeToText(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * HTML encode special characters
 * Converts < > & " ' to HTML entities
 *
 * @param str - String to encode
 * @returns HTML-encoded string
 */
export function htmlEncode(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * HTML decode entities back to characters
 *
 * @param str - HTML-encoded string
 * @returns Decoded string
 */
export function htmlDecode(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

/**
 * URL encode for safe URLs
 *
 * @param str - String to encode
 * @returns URL-encoded string
 */
export function urlEncode(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  return encodeURIComponent(str);
}

/**
 * JavaScript string escape for embedding in <script> tags
 *
 * @param str - String to escape
 * @returns Escaped string safe for JS context
 */
export function jsEscape(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/</g, "\\x3C")
    .replace(/>/g, "\\x3E");
}

/**
 * CSS escape for embedding in style attributes
 *
 * @param str - String to escape
 * @returns Escaped string safe for CSS context
 */
export function cssEscape(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str.replace(/[<>"']/g, (char) => {
    const hex = char.charCodeAt(0).toString(16);
    return "\\" + hex.padStart(6, "0");
  });
}

/**
 * React component for safely rendering HTML
 *
 * Usage:
 * <SafeHtml html={userContent} />
 */
export function SafeHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const sanitized = sanitizeForRender(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * React component for rendering text only (strips all HTML)
 *
 * Usage:
 * <SafeText text={userInput} />
 */
export function SafeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const sanitized = sanitizeToText(text);

  return <span className={className}>{sanitized}</span>;
}

/**
 * Configure DOMPurify for stricter security
 */
export function configureStrictDOMPurify(): void {
  DOMPurify.setConfig({
    ALLOWED_TAGS: ["p", "br", "strong", "em"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  });
}

/**
 * Check if string contains potentially dangerous content
 *
 * @param str - String to check
 * @returns true if dangerous patterns detected
 */
export function hasDangerousContent(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }

  const dangerous = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /eval\(/i,
  ];

  return dangerous.some((pattern) => pattern.test(str));
}
