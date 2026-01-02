/**
 * Client-side authentication utilities with automatic token refresh
 *
 * Features:
 * - Automatic access token refresh on 401 errors
 * - Retry failed requests after refresh
 * - In-memory token storage (optional)
 * - Secure HTTP-only cookie support
 */
import { logger } from "@/lib/logger";

// In-memory token storage (for non-browser clients)
let accessToken: string | null = null;
let refreshToken: string | null = null;

/**
 * Store tokens in memory
 * Note: Tokens are also stored in HTTP-only cookies for security
 */
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

/**
 * Get stored access token
 */
export function getStoredAccessToken(): string | null {
  return accessToken;
}

/**
 * Clear stored tokens
 */
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

/**
 * Fetch with automatic token refresh
 *
 * If a request returns 401, automatically attempts to refresh the token
 * and retry the original request
 *
 * Usage:
 *   const data = await fetchWithAuth('/api/users');
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Add Authorization header if token exists
  const headers = new Headers(options.headers);

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include cookies
  });

  // If 401 (Unauthorized), try to refresh token
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry original request with new token
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  return response;
}

/**
 * Refresh access token using refresh token
 *
 * Returns new access token on success, null on failure
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Send cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });

    if (!response.ok) {
      logger.error("token_refresh_failed", { status: response.status });
      clearTokens();

      // Redirect to login if refresh fails
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return null;
    }

    const data = await response.json();

    if (data.success && data.tokens?.accessToken) {
      // Store new tokens
      accessToken = data.tokens.accessToken;

      if (data.tokens.refreshToken) {
        refreshToken = data.tokens.refreshToken;
      }

      return data.tokens.accessToken;
    }

    return null;
  } catch (error) {
    logger.error("token_refresh_error", { error: String(error) });
    clearTokens();
    return null;
  }
}

/**
 * Login helper
 */
export async function login(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: { id: number; email: string; name: string; role: string };
  message?: string;
}> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.tokens) {
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }

    return data;
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      message: err.message || "Login failed",
    };
  }
}

/**
 * Logout helper
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    logger.error("logout_error", { error: String(error) });
  } finally {
    clearTokens();

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

/**
 * Verify current authentication status
 */
export async function verifyAuth(): Promise<{
  authenticated: boolean;
  user?: { userId: number; email: string; role: string };
}> {
  try {
    const response = await fetchWithAuth("/api/auth/verify");
    const data = await response.json();

    return {
      authenticated: data.authenticated,
      user: data.user,
    };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Setup automatic token refresh before expiry
 * Refreshes token 1 minute before it expires
 */
export function setupAutoRefresh() {
  // Refresh token every 14 minutes (1 minute before expiry)
  const refreshInterval = 14 * 60 * 1000; // 14 minutes in milliseconds

  const interval = setInterval(async () => {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      // Stop auto-refresh if refresh fails
      clearInterval(interval);
    }
  }, refreshInterval);

  // Cleanup function
  return () => clearInterval(interval);
}
