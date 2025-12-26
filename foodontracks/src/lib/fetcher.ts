/**
 * SWR Fetcher Utility
 *
 * This function is used by SWR to fetch data from API endpoints.
 * It handles error checking and JSON parsing automatically.
 */

interface FetchError extends Error {
  status?: number;
  info?: Record<string, unknown>;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: FetchError = new Error("Failed to fetch data");
    // Attach extra info to the error object
    error.status = res.status;
    error.info = await res.json().catch(() => ({}));
    throw error;
  }

  return res.json();
};

/**
 * Fetcher with authentication token
 * Use this when your API requires authentication
 */
export const authenticatedFetcher = async (url: string) => {
  const token = localStorage.getItem("authToken");

  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) {
    const error: FetchError = new Error("Failed to fetch data");
    error.status = res.status;
    error.info = await res.json().catch(() => ({}));
    throw error;
  }

  return res.json();
};

/**
 * POST fetcher for mutations
 */
export const postFetcher = async (
  url: string,
  { arg }: { arg: Record<string, unknown> }
) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error: FetchError = new Error("Failed to post data");
    error.status = res.status;
    error.info = await res.json().catch(() => ({}));
    throw error;
  }

  return res.json();
};
