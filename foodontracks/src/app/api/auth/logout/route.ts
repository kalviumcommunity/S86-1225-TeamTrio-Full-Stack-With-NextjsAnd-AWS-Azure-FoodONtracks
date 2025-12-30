import { NextResponse } from "next/server";
import { clearTokenCookies } from "@/app/lib/jwtService";

/**
 * POST /api/auth/logout
 *
 * Logs out user by clearing authentication cookies
 *
 * Security considerations:
 * - Clears both access and refresh tokens
 * - Invalidates cookies on client-side
 * - Client should also clear any stored tokens
 */
export async function POST() {
  try {
    // Clear authentication cookies
    clearTokenCookies();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Logout failed", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 *
 * Alternative logout via GET (for simple links)
 */
export async function GET(req: Request) {
  return POST(req);
}
