import { NextResponse } from "next/server";
import {
  verifyAccessToken,
  getAccessToken,
  decodeToken,
  getTokenExpiry,
  getRefreshToken,
  verifyRefreshToken,
  generateAccessToken,
  setTokenCookies,
  generateRefreshToken,
} from "@/app/lib/jwtService";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
export const runtime = "nodejs";


/**
 * GET /api/auth/verify
 *
 * Verifies if the current access token is valid
 * Returns token details and user information
 * Automatically refreshes expired access tokens using refresh token
 *
 * Use case: Check authentication status before making protected requests
 */
export const GET = withLogging(async () => {
  try {
    let accessToken = await getAccessToken();

    if (!accessToken) {
      // No access token, try to refresh using refresh token
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        return NextResponse.json(
          {
            success: false,
            message: "No access token provided",
            authenticated: false,
          },
          { status: 401 }
        );
      }

      // Try to refresh the access token
      try {
        const refreshPayload = verifyRefreshToken(refreshToken);
        accessToken = generateAccessToken({
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role,
          roleLevel: refreshPayload.roleLevel,
          restaurantId: refreshPayload.restaurantId,
        });

        // Set the new access token
        const newRefreshToken = generateRefreshToken({
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role,
          roleLevel: refreshPayload.roleLevel,
          restaurantId: refreshPayload.restaurantId,
        });
        
        await setTokenCookies(accessToken, newRefreshToken);
        logger.info("token_auto_refreshed", { context: { userId: refreshPayload.userId } });
      } catch (refreshError) {
        logger.warn("refresh_token_invalid", { context: { error: String(refreshError) } });
        return NextResponse.json(
          {
            success: false,
            message: "Session expired, please login again",
            authenticated: false,
          },
          { status: 401 }
        );
      }
    }

    // Verify and decode token
    try {
      await dbConnect();
      const payload = verifyAccessToken(accessToken);
      const decoded = decodeToken(accessToken);
      const expiresAt = getTokenExpiry(accessToken);

      // Fetch full user data to get restaurantId
      const user = await User.findById(payload.userId).select('name email role restaurantId isActive').lean();

      if (!user) {
        logger.warn("verify_user_not_found", { context: { userId: payload.userId } });
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
            authenticated: false,
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: payload.userId,
          userId: payload.userId,
          name: user.name || '',
          email: user.email || payload.email,
          role: user.role || payload.role,
          restaurantId: user.restaurantId || null,
          isActive: user.isActive,
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
      
      // If access token is expired, try to refresh it
      if (err.message === "Access token expired") {
        const refreshToken = await getRefreshToken();
        
        if (refreshToken) {
          try {
            const refreshPayload = verifyRefreshToken(refreshToken);
            const newAccessToken = generateAccessToken({
              userId: refreshPayload.userId,
              email: refreshPayload.email,
              role: refreshPayload.role,
              roleLevel: refreshPayload.roleLevel,
              restaurantId: refreshPayload.restaurantId,
            });

            const newRefreshToken = generateRefreshToken({
              userId: refreshPayload.userId,
              email: refreshPayload.email,
              role: refreshPayload.role,
              roleLevel: refreshPayload.roleLevel,
              restaurantId: refreshPayload.restaurantId,
            });

            await setTokenCookies(newAccessToken, newRefreshToken);
            logger.info("token_auto_refreshed_on_verify", { context: { userId: refreshPayload.userId } });

            // Fetch user data with new token
            await dbConnect();
            const user = await User.findById(refreshPayload.userId).select('name email role restaurantId isActive').lean();

            if (!user) {
              return NextResponse.json(
                {
                  success: false,
                  message: "User not found",
                  authenticated: false,
                },
                { status: 401 }
              );
            }

            const expiresAt = getTokenExpiry(newAccessToken);
            const decoded = decodeToken(newAccessToken);

            return NextResponse.json({
              success: true,
              authenticated: true,
              user: {
                id: refreshPayload.userId,
                userId: refreshPayload.userId,
                name: user.name || '',
                email: user.email || refreshPayload.email,
                role: user.role || refreshPayload.role,
                restaurantId: user.restaurantId || null,
                isActive: user.isActive,
              },
              token: {
                type: "access",
                expiresAt: expiresAt?.toISOString(),
                issuedAt: decoded?.iat
                  ? new Date(decoded.iat * 1000).toISOString()
                  : null,
              },
            });
          } catch (refreshError) {
            logger.warn("auto_refresh_failed", { context: { error: String(refreshError) } });
          }
        }
      }
      
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
    logger.error("auth_verify_error", error);
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
export const POST = withLogging(async () => {
  return GET();
});
