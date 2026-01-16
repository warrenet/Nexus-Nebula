import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * On web, uses window.location.origin as the API is served from the same domain.
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Check for explicit EXPO_PUBLIC_DOMAIN first
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (host) {
    const url = new URL(`https://${host}`);
    return url.href;
  }

  // On web, use the current origin (same-domain API via Vercel rewrites)
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  // On native without EXPO_PUBLIC_DOMAIN, throw helpful error
  throw new Error(
    "EXPO_PUBLIC_DOMAIN is not set. Required for native apps to connect to API.",
  );
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/**
 * Smart retry function - only retry on network errors and 5xx, not 4xx
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;

  if (error instanceof Error) {
    const message = error.message;
    // Don't retry on client errors (4xx)
    if (message.startsWith("4")) return false;
    // Retry on network errors and server errors (5xx)
    if (message.startsWith("5") || message.includes("fetch")) return true;
  }

  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable for better UX
      staleTime: 60_000, // 1 minute default
      gcTime: 300_000, // 5 minute garbage collection
      retry: shouldRetry,
      retryDelay,
    },
    mutations: {
      retry: false,
    },
  },
});
