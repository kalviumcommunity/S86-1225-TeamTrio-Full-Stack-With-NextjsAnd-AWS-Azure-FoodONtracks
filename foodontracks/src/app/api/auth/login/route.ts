import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { generateTokenPair, setTokenCookies } from "@/app/lib/jwtService";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

/**
 * POST /api/auth/login
 *
 * Authenticates user and issues access + refresh tokens
 *
 * Response includes:
 * - Access Token: Short-lived (15 min) - for API requests
 * - Refresh Token: Long-lived (7 days) - for token renewal
 *
 * Tokens stored in HTTP-only cookies for security
 */
export const POST = withLogging(async (req: Request) => {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookies
    setTokenCookies(accessToken, refreshToken);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken, // Also return in body for non-browser clients
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("auth_login_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, message: "Login failed", error: error.message },
      { status: 500 }
    );
  }
});
