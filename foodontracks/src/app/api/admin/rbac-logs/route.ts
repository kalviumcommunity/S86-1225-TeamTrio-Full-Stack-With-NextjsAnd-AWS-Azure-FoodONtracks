/**
 * RBAC Logs API Route
 *
 * Admin-only endpoint to view RBAC audit logs and statistics.
 * Demonstrates how to protect admin routes with RBAC middleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/middleware/rbac";
import {
  getRbacLogs,
  getRbacStats,
  getRecentDenials,
  getSuspiciousActivity,
  exportRbacLogs,
} from "@/middleware/rbacLogger";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/rbac-logs
 *
 * Get RBAC audit logs and statistics
 * Requires: ADMIN role
 */
export const GET = withAdmin(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;

  // Get query parameters
  const action = searchParams.get("action") || "logs";
  const userId = searchParams.get("userId");
  const role = searchParams.get("role");
  const resource = searchParams.get("resource");
  const allowed = searchParams.get("allowed");
  const limit = searchParams.get("limit");

  try {
    switch (action) {
      case "stats":
        // Get statistics
        return NextResponse.json({
          success: true,
          data: getRbacStats(),
        });

      case "denials":
        // Get recent denials
        const denialLimit = limit ? parseInt(limit) : 50;
        return NextResponse.json({
          success: true,
          data: getRecentDenials(denialLimit),
        });

      case "suspicious":
        // Get suspicious activity
        const threshold = limit ? parseInt(limit) : 5;
        return NextResponse.json({
          success: true,
          data: getSuspiciousActivity(threshold),
        });

      case "export":
        // Export all logs as JSON
        return new NextResponse(exportRbacLogs(), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="rbac-logs-${new Date().toISOString()}.json"`,
          },
        });

      case "logs":
      default:
        // Get filtered logs
        const filters: Record<string, string | number | boolean> = {};
        if (userId) filters.userId = parseInt(userId);
        if (role) filters.role = role;
        if (resource) filters.resource = resource;
        if (allowed !== null) filters.allowed = allowed === "true";
        if (limit) filters.limit = parseInt(limit);

        return NextResponse.json({
          success: true,
          data: getRbacLogs(filters),
        });
    }
  } catch (error) {
    logger.error("rbac_logs_fetch_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve RBAC logs",
      },
      { status: 500 }
    );
  }
});
