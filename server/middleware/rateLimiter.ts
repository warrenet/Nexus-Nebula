/**
 * Rate Limiter Middleware
 * Implements sliding window rate limiting with IP-based tracking
 */

import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// In-memory store for rate limiting
const rateLimitStore: Map<string, RateLimitRecord> = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > 300000) {
      // 5 minutes
      rateLimitStore.delete(key);
    }
  }
}, 300000);

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
};

const EXECUTE_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 30, // Stricter limit for mission execution
};

function getClientIP(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.ip || "unknown";
}

function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now - record.windowStart >= config.windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  const elapsedMs = now - record.windowStart;
  const resetIn = config.windowMs - elapsedMs;

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetIn,
  };
}

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(config: RateLimitConfig = DEFAULT_CONFIG) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = getClientIP(req);
    const key = `${clientIP}:${req.path}`;

    const { allowed, remaining, resetIn } = checkRateLimit(key, config);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(Date.now() / 1000 + resetIn / 1000).toString(),
    );

    if (!allowed) {
      res.setHeader("Retry-After", Math.ceil(resetIn / 1000).toString());
      res.status(429).json({
        error: "Too many requests",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil(resetIn / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Stricter rate limiter for mission execution endpoint
 */
export const missionRateLimiter = rateLimiter(EXECUTE_CONFIG);

/**
 * Standard rate limiter for read-only endpoints
 */
export const standardRateLimiter = rateLimiter(DEFAULT_CONFIG);
