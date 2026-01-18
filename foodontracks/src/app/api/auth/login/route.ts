import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { User } from "@/models/User";
import { generateTokenPair } from "@/app/lib/jwtService";
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
    await dbConnect();
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
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

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Generate token pair with role information
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      restaurantId: user.restaurantId?.toString(),
    });

    logger.info('user_login_success', {
      userId: user._id.toString(),
      context: {
        email: user.email,
        role: user.role,
      },
    });

    // Determine redirect URL based on role
    const redirectMap: Record<string, string> = {
      ADMIN: '/dashboard/admin',
      RESTAURANT_OWNER: '/dashboard/restaurant',
      DELIVERY_GUY: '/dashboard/delivery',
      CUSTOMER: '/dashboard/customer',
    };
    const redirectUrl = redirectMap[user.role] || '/dashboard';

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleLevel: user.roleLevel,
        restaurantId: user.restaurantId,
      },
      redirectUrl, // Role-based redirect URL
      tokens: {
        accessToken, // Also return in body for non-browser clients
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });

    // Set HTTP-only cookies in response
    const isProduction = process.env.NODE_ENV === "production";
    
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    console.log("🍪 Cookies set:", {
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      isProduction,
      secure: false,
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("auth_login_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, message: "Login failed", error: error.message },
      { status: 500 }
    );
  }
});
