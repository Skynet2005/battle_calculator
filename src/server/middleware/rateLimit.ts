import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware
 *
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Middleware function that checks rate limits
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: NextRequest): NextResponse | null => {
    // Get client identifier (IP address or user ID)
    const identifier = getClientIdentifier(req);

    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to clean up on each request
      cleanupExpiredEntries(now);
    }

    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired entry
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return null; // Allow request
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} second${retryAfter !== 1 ? 's' : ''}.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
          },
        }
      );
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(identifier, entry);

    // Add rate limit headers
    const remaining = maxRequests - entry.count;
    return null; // Allow request, but we can't set headers here
    // Headers would need to be set in the route handler
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || req.ip || 'unknown';

  // For authenticated requests, you could use user ID instead
  // const authHeader = req.headers.get('authorization');
  // if (authHeader) {
  //   // Extract user ID from token
  //   return `user:${userId}`;
  // }

  return `ip:${ip}`;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get rate limit headers for a request
 */
export function getRateLimitHeaders(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Record<string, string> {
  const entry = rateLimitStore.get(identifier);
  if (!entry) {
    return {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': maxRequests.toString(),
      'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
    };
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
  };
}
