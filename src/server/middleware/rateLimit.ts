import { NextRequest } from 'next/server';
import { ApiError } from './apiErrorHandler';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * In-memory store for rate limit counters.
 * Note: Limits are per-process. With multiple instances or serverless,
 * each instance has its own store; limits are not shared across instances.
 */
const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

/** Remove expired entries to prevent memory leaks */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Extract a stable identifier from the request for rate limiting.
 * Uses the X-Forwarded-For header (set by reverse proxies) or falls back to
 * a generic key so the limiter still works in development.
 */
function getClientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown-ip';
}

/**
 * Create a rate limiter for a specific route or group of routes.
 *
 * @example
 * ```ts
 * const loginLimiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
 *
 * export const POST = withErrorHandling(async (req) => {
 *   await loginLimiter(req);
 *   // ... handler logic
 * });
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs } = config;

  return function rateLimit(req: NextRequest, keyPrefix?: string): void {
    cleanupExpiredEntries();

    const clientKey = getClientKey(req);
    const key = `${keyPrefix ?? req.nextUrl.pathname}:${clientKey}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      throw new ApiError(
        429,
        `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        'RATE_LIMIT_EXCEEDED'
      );
    }
  };
}

/** Pre-configured limiters for common route groups */
export const authLoginLimiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
export const authRegisterLimiter = createRateLimiter({ maxRequests: 3, windowMs: 60 * 60 * 1000 });
export const profileMutationLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60 * 1000 });
