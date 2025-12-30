import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "dev_jwt_secret_change_me";

/**
 * Next.js Middleware for route protection
 *
 * Features:
 * - Validates access tokens for protected routes
 * - Handles both API routes and page routes
 * - Provides user context to downstream handlers
 * - Redirects unauthenticated users to login
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — anyone can access
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  // Auth API routes are always public (they handle their own auth)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protect admin and users API routes
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/users")) {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.split(" ")[1];

    // Fallback to cookie
    if (!token) {
      token = req.cookies.get("accessToken")?.value;
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Access token required",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(
        token,
        ACCESS_TOKEN_SECRET
      ) as jwt.JwtPayload & {
        type: string;
        userId: number;
        email: string;
        role: string;
      };

      // Check token type
      if (decoded.type !== "access") {
        return NextResponse.json(
          { success: false, message: "Invalid token type" },
          { status: 401 }
        );
      }

      // Normalize role comparison for enums/strings
      const role = (decoded.role || "").toString().toUpperCase();

      // Admin-only guard
      if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
        return NextResponse.json(
          { success: false, message: "Admin access required" },
          { status: 403 }
        );
      }

      // Attach user info for downstream handlers via request headers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", String(decoded.userId ?? ""));
      requestHeaders.set("x-user-email", decoded.email ?? "");
      requestHeaders.set("x-user-role", role);

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch (err: unknown) {
      const error = err as Error & { name?: string };
      const isExpired = error.name === "TokenExpiredError";

      return NextResponse.json(
        {
          success: false,
          message: isExpired ? "Access token expired" : "Invalid token",
          expired: isExpired,
          requiresRefresh: isExpired,
        },
        { status: 401 }
      );
    }
  }

  // Protect page routes (dashboard, users pages)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    const token = req.cookies.get("accessToken")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const decoded = jwt.verify(
        token,
        ACCESS_TOKEN_SECRET
      ) as jwt.JwtPayload & { type: string };

      // Check token type
      if (decoded.type !== "access") {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    } catch {
      // If token expired, redirect to refresh or login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("expired", "true");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/api/admin/:path*",
    "/api/users/:path*",
  ],
};
