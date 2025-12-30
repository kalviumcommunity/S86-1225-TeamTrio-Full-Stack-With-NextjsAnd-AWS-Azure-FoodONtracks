/**
 * SQL Injection Testing API Route
 *
 * Demonstrates SQL injection prevention using Prisma's parameterized queries
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeSqlInput, isSuspiciousInput } from "@/utils/sanitize";

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Detect SQL injection patterns
    const suspicious = isSuspiciousInput(input);
    const sqlPatterns = [
      {
        pattern: /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
        name: "OR/AND 1=1 pattern",
      },
      { pattern: /\bUNION\b.*\bSELECT\b/i, name: "UNION SELECT" },
      { pattern: /\bDROP\b.*\bTABLE\b/i, name: "DROP TABLE" },
      { pattern: /;\s*\w+/i, name: "Stacked queries" },
      { pattern: /--/, name: "SQL comment" },
      { pattern: /\/\*.*\*\//i, name: "Multi-line comment" },
      { pattern: /\bEXEC\b|\bEXECUTE\b/i, name: "EXEC command" },
      { pattern: /\bINSERT\b.*\bINTO\b/i, name: "INSERT INTO" },
      { pattern: /\bUPDATE\b.*\bSET\b/i, name: "UPDATE SET" },
      { pattern: /\bDELETE\b.*\bFROM\b/i, name: "DELETE FROM" },
    ];

    const detectedPatterns = sqlPatterns
      .filter(({ pattern }) => pattern.test(input))
      .map(({ name }) => name);

    // Sanitize the input (backup measure)
    const sanitized = sanitizeSqlInput(input);

    // Example of SAFE query using Prisma (parameterized)
    // This is safe because Prisma uses parameterized queries
    let safeQueryResult = null;
    try {
      // Demonstrate safe query - searching for user by email
      safeQueryResult = await prisma.user.findMany({
        where: {
          email: {
            contains: sanitized, // Even if we pass malicious input, Prisma treats it as data
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
        take: 5,
      });
    } catch (error) {
      console.error("[SQL Test] Query error:", error);
    }

    // Example of what a VULNERABLE query would look like (DO NOT USE)
    const vulnerableQueryExample = `SELECT * FROM users WHERE email = '${input}'`;
    const safeQueryExample =
      "prisma.user.findMany({ where: { email: { contains: sanitized } } })";

    return NextResponse.json({
      original: input,
      sanitized,
      detectedPatterns,
      suspicious,
      protection: {
        method: "Prisma ORM with parameterized queries",
        vulnerableExample: vulnerableQueryExample,
        safeExample: safeQueryExample,
        explanation: suspicious
          ? "Malicious SQL patterns detected. Prisma parameterized queries prevent SQL injection by treating user input as data, not executable code."
          : "Input appears safe. Prisma still uses parameterized queries for all database operations.",
        safe: true, // Always safe with Prisma
      },
      queryResult: {
        executed: safeQueryExample,
        resultsFound: safeQueryResult?.length || 0,
        note: "This query is safe because Prisma uses parameterized queries internally",
      },
    });
  } catch (error) {
    console.error("[SQL Test] Error:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
