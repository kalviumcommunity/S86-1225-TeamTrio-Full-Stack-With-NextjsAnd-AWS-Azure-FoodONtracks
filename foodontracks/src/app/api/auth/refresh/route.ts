import { NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateAccessToken,
  setTokenCookies,
  getRefreshToken,
  generateRefreshToken,
} from "@/app/lib/jwtService";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

/**
 * POST /api/auth/refresh
 *
 * Refreshes an expired access token using a valid refresh token
 *
 * Flow:
 * 1. Client sends request with refresh token (in cookie or body)
 * 2. Server validates refresh token
 * 3. If valid, generates new access token
 * 4. Optionally rotates refresh token for security
 * 5. Returns new token(s) to client
 *
 * Security: Implements token rotation to prevent replay attacks
 */
export const POST = withLogging(async (req: Request) => {
  try {
    // Get refresh token from cookie or request body
    let refreshToken = getRefreshToken();

    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token required" },
        { status: 401 }
      );
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error: unknown) {
      const err = error as Error;
      return NextResponse.json(
        { success: false, message: err.message || "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Optional: Rotate refresh token for enhanced security
    // This prevents token replay attacks
    const shouldRotateRefresh = process.env.ROTATE_REFRESH_TOKENS === "true";
    let newRefreshToken = refreshToken;

    if (shouldRotateRefresh) {
      newRefreshToken = generateRefreshToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });
    }

    // Set new cookies
    setTokenCookies(newAccessToken, newRefreshToken);

    // Return new tokens
    return NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      tokens: {
        accessToken: newAccessToken,
        ...(shouldRotateRefresh && { refreshToken: newRefreshToken }),
        expiresIn: 900, // 15 minutes
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("auth_refresh_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, message: "Token refresh failed", error: error.message },
      { status: 500 }
    );
  }
});

/**
 * GET /api/auth/refresh
 *
 * Alternative endpoint for GET requests (some clients prefer GET)
 */
export const GET = withLogging(async (req: Request) => {
  return POST(req as any);
});
