/**
 * JWT Token Service
 *
 * Handles generation and validation of access and refresh tokens
 * - Access Token: Short-lived (15 minutes), used for API requests
 * - Refresh Token: Long-lived (7 days), used to obtain new access tokens
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Environment variables
const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret_change_me";

// Token lifespans
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

/**
 * JWT Token Structure:
 * {
 *   header: { alg: "HS256", typ: "JWT" },
 *   payload: { userId, email, role, exp, iat },
 *   signature: "hashed-verification-string"
 * }
 */

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  type?: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate Access Token (short-lived)
 * Used for authenticating API requests
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: "access",
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

/**
 * Generate Refresh Token (long-lived)
 * Used to obtain new access tokens after expiry
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as jwt.JwtPayload & {
      type: string;
      userId: number;
      email: string;
      role: string;
    };

    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    if (err.name === "TokenExpiredError") {
      throw new Error("Access token expired");
    }
    if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid access token");
    }
    throw error;
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      REFRESH_TOKEN_SECRET
    ) as jwt.JwtPayload & {
      type: string;
      userId: number;
      email: string;
      role: string;
    };

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    if (err.name === "TokenExpiredError") {
      throw new Error("Refresh token expired");
    }
    if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
}

/**
 * Set HTTP-only cookies for tokens
 * Security Features:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: Only sent over HTTPS (in production)
 * - sameSite: Prevents CSRF attacks
 */
export function setTokenCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // Access Token Cookie (15 minutes)
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60, // 15 minutes in seconds
    path: "/",
  });

  // Refresh Token Cookie (7 days)
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });
}

/**
 * Get token from cookies or Authorization header
 */
export function getAccessToken(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try cookie (for browser requests)
  const cookieStore = cookies();
  const tokenFromCookie = cookieStore.get("accessToken");

  return tokenFromCookie?.value || null;
}

/**
 * Get refresh token from cookies
 */
export function getRefreshToken(): string | null {
  const cookieStore = cookies();
  const token = cookieStore.get("refreshToken");
  return token?.value || null;
}

/**
 * Clear authentication cookies
 */
export function clearTokenCookies() {
  const cookieStore = cookies();

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

/**
 * Decode token without verification (for debugging)
 * WARNING: Do not use for authentication - this doesn't verify signature
 */
export function decodeToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.decode(token) as jwt.JwtPayload | null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;

  return new Date(decoded.exp * 1000);
}
