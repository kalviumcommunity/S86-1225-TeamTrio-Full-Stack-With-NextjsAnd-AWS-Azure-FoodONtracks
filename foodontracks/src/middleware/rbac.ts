/**
 * RBAC Middleware
 *
 * This middleware provides role-based access control for API routes.
 * It verifies the user's JWT token and checks if they have the required
 * permissions to access a specific resource with a specific action.
 *
 * Features:
 * - JWT token verification
 * - Permission checking based on role and resource
 * - Audit logging for allow/deny decisions
 * - Flexible permission requirements (single or multiple)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, TokenPayload } from "@/app/lib/jwtService";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  Permission,
  Resource,
  UserRole,
} from "@/config/roles";
import { logRbacDecision } from "./rbacLogger";
import { logger } from "@/lib/logger";

/**
 * Extended request type with user information
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * RBAC Check Options
 */
export interface RbacOptions {
  resource: Resource;
  permission?: Permission; // Single permission
  permissions?: Permission[]; // Multiple permissions
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
}

/**
 * Error response for unauthorized access
 */
function unauthorizedResponse(message: string, status: number = 401) {
  return NextResponse.json(
    {
      error: message,
      code: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Extract and verify JWT token from request
 *
 * @param request - The incoming request
 * @returns Token payload or null if invalid
 */
export function extractAndVerifyToken(
  request: NextRequest
): TokenPayload | null {
  try {
    // Try Authorization header first
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Try cookie as fallback
      token = request.cookies.get("accessToken")?.value || null;
    }

    if (!token) {
      return null;
    }

    // Verify and decode token
    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    logger.error("[RBAC] Token verification failed", { error: String(error) });
    return null;
  }
}

/**
 * Main RBAC Middleware Function
 *
 * Verifies user authentication and checks if they have required permissions.
 *
 * @param request - The incoming request
 * @param options - RBAC configuration (resource and permissions)
 * @returns Response if denied, null if allowed
 */
export function checkRbac(
  request: NextRequest,
  options: RbacOptions
): NextResponse | null {
  const { resource, permission, permissions, requireAll = false } = options;

  // Step 1: Extract and verify token
  const user = extractAndVerifyToken(request);

  if (!user) {
    logRbacDecision({
      allowed: false,
      role: "ANONYMOUS",
      resource,
      permission: permission || permissions?.join(",") || "unknown",
      reason: "No valid authentication token",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      path: request.nextUrl.pathname,
    });

    return unauthorizedResponse("Authentication required. Please log in.");
  }

  const userRole = user.role as UserRole;

  // Step 2: Check permissions
  let allowed = false;
  let checkedPermission = "";

  if (permission) {
    // Single permission check
    allowed = hasPermission(userRole, resource, permission);
    checkedPermission = permission;
  } else if (permissions && permissions.length > 0) {
    // Multiple permissions check
    if (requireAll) {
      allowed = hasAllPermissions(userRole, resource, permissions);
      checkedPermission = permissions.join(" AND ");
    } else {
      allowed = hasAnyPermission(userRole, resource, permissions);
      checkedPermission = permissions.join(" OR ");
    }
  } else {
    // No permission specified - just authenticate
    allowed = true;
    checkedPermission = "authenticated";
  }

  // Step 3: Log the decision
  logRbacDecision({
    allowed,
    userId: typeof user.userId === 'number' ? user.userId : undefined,
    role: userRole,
    resource,
    permission: checkedPermission,
    reason: allowed ? "Permission granted" : "Insufficient permissions",
    ip: request.headers.get("x-forwarded-for") || "unknown",
    path: request.nextUrl.pathname,
  });

  // Step 4: Return response if denied
  if (!allowed) {
    return unauthorizedResponse(
      `Access denied: You do not have permission to ${checkedPermission} ${resource}.`,
      403
    );
  }

  // Store user in request for use in route handler
  (request as AuthenticatedRequest).user = user;

  return null; // Allowed - continue to route handler
}

/**
 * Higher-order function to wrap API route handlers with RBAC
 *
 * Usage:
 * ```
 * export const GET = withRbac(
 *   async (req) => { ... },
 *   { resource: 'users', permission: 'read' }
 * );
 * ```
 */
export function withRbac(
  handler: (
    request: AuthenticatedRequest,
    context?: unknown
  ) => Promise<NextResponse>,
  options: RbacOptions
) {
  return async (
    request: NextRequest,
    context?: unknown
  ): Promise<NextResponse> => {
    // Check RBAC
    const rbacError = checkRbac(request, options);
    if (rbacError) {
      return rbacError;
    }

    // Extract user and add to request
    const user = extractAndVerifyToken(request);
    (request as AuthenticatedRequest).user = user!;

    // Call the actual handler
    return handler(request as AuthenticatedRequest, context);
  };
}

/**
 * Simple authentication middleware (no permission check)
 * Just verifies that the user is logged in
 */
export function withAuth(
  handler: (
    request: AuthenticatedRequest,
    context?: unknown
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: unknown
  ): Promise<NextResponse> => {
    const user = extractAndVerifyToken(request);

    if (!user) {
      logRbacDecision({
        allowed: false,
        role: "ANONYMOUS",
        resource: "unknown",
        permission: "authenticated",
        reason: "No valid authentication token",
        ip: request.headers.get("x-forwarded-for") || "unknown",
        path: request.nextUrl.pathname,
      });

      return unauthorizedResponse("Authentication required. Please log in.");
    }

    logRbacDecision({
      allowed: true,
      userId: typeof user.userId === 'number' ? user.userId : undefined,
      role: user.role,
      resource: "unknown",
      permission: "authenticated",
      reason: "Valid authentication token",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      path: request.nextUrl.pathname,
    });

    (request as AuthenticatedRequest).user = user;
    return handler(request as AuthenticatedRequest, context);
  };
}

/**
 * Admin-only middleware
 * Shorthand for requiring ADMIN role
 */
export function withAdmin(
  handler: (
    request: AuthenticatedRequest,
    context?: unknown
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: unknown
  ): Promise<NextResponse> => {
    const user = extractAndVerifyToken(request);

    if (!user) {
      return unauthorizedResponse("Authentication required. Please log in.");
    }

    if (user.role !== "ADMIN") {
      logRbacDecision({
        allowed: false,
        userId: typeof user.userId === 'number' ? user.userId : undefined,
        role: user.role,
        resource: "admin",
        permission: "manage",
        reason: "Not an admin",
        ip: request.headers.get("x-forwarded-for") || "unknown",
        path: request.nextUrl.pathname,
      });

      return unauthorizedResponse(
        "Access denied: Admin privileges required.",
        403
      );
    }

    logRbacDecision({
      allowed: true,
      userId: typeof user.userId === 'number' ? user.userId : undefined,
      role: user.role,
      resource: "admin",
      permission: "manage",
      reason: "Admin access granted",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      path: request.nextUrl.pathname,
    });

    (request as AuthenticatedRequest).user = user;
    return handler(request as AuthenticatedRequest, context);
  };
}
