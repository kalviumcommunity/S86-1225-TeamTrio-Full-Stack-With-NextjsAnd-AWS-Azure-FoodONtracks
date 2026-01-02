import { NextResponse } from "next/server";
import {
  verifyAccessToken,
  getAccessToken,
  decodeToken,
  getTokenExpiry,
} from "@/app/lib/jwtService";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

/**
 * GET /api/auth/verify
 *
 * Verifies if the current access token is valid
 * Returns token details and user information
 *
 * Use case: Check authentication status before making protected requests
 */
export const GET = withLogging(async (req: Request) => {
  try {
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No access token provided",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // Verify and decode token
    try {
      const payload = verifyAccessToken(accessToken);
      const decoded = decodeToken(accessToken);
      const expiresAt = getTokenExpiry(accessToken);

      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        },
        token: {
          type: "access",
          expiresAt: expiresAt?.toISOString(),
          issuedAt: decoded?.iat
            ? new Date(decoded.iat * 1000).toISOString()
            : null,
        },
      });
    } catch (error: unknown) {
      const err = error as Error;
      return NextResponse.json(
        {
          success: false,
          message: err.message,
          authenticated: false,
          requiresRefresh: err.message === "Access token expired",
        },
        { status: 401 }
      );
    }
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("auth_verify_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, message: "Verification failed", authenticated: false },
      { status: 500 }
    );
  }
});

/**
 * POST /api/auth/verify
 *
 * Same as GET, but accepts token in request body
 */
export const POST = withLogging(async (req: Request) => {
  return GET(req as any);
});
