/**
 * XSS Testing API Route
 *
 * Demonstrates input sanitization for XSS prevention
 */

import { NextResponse } from "next/server";
import {
  sanitizeStrictInput,
  getSanitizationReport,
  isSuspiciousInput,
} from "@/utils/sanitize";

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Sanitize the input
    const sanitized = sanitizeStrictInput(input);
    const report = getSanitizationReport(input, sanitized);
    const suspicious = isSuspiciousInput(input);

    return NextResponse.json({
      original: input,
      sanitized,
      report: {
        ...report,
        suspicious,
      },
      detectedPatterns: suspicious
        ? [
            input.includes("<script") && "Script tag injection",
            input.includes("javascript:") && "JavaScript protocol",
            input.includes("onerror") && "Event handler injection",
            input.includes("<iframe") && "Iframe injection",
          ].filter(Boolean)
        : [],
      protection: {
        method: "sanitize-html library",
        action: "Removed all HTML tags and dangerous patterns",
        safe: !suspicious || sanitized.length === 0,
      },
    });
  } catch (error) {
    console.error("[XSS Test] Error:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
