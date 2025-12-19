import { NextResponse } from 'next/server';

/**
 * Rate Limiting Middleware
 *
 * Per-user rate limiting with complexity throttling.
 * Base limit: 10 requests per minute per user.
 * Complexity throttle: Monte Carlo runs and maxTurns add weight.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  complexity: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private baseLimit: number = 10,
    private windowMs: number = 60 * 1000 // 1 minute
  ) {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   */
  checkLimit(
    userId: string,
    complexity: number = 1
  ): { allowed: true } | { allowed: false; retryAfter: number } {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry || now > entry.resetAt) {
      // Create new window
      this.limits.set(userId, {
        count: complexity,
        resetAt: now + this.windowMs,
        complexity: complexity,
      });
      return { allowed: true };
    }

    // Check if adding this request would exceed the limit
    const newCount = entry.count + complexity;
    if (newCount > this.baseLimit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Update entry
    entry.count = newCount;
    entry.complexity = Math.max(entry.complexity, complexity);
    return { allowed: true };
  }

  /**
   * Calculate complexity weight for a request
   */
  calculateComplexity(params: {
    simulations?: number;
    maxTurns?: number;
  }): number {
    let weight = 1;

    // Monte Carlo runs add weight
    if (params.simulations && params.simulations > 1) {
      weight += Math.ceil(params.simulations / 100); // 1 weight per 100 simulations
    }

    // Max turns adds weight
    if (params.maxTurns && params.maxTurns > 50) {
      weight += Math.ceil((params.maxTurns - 50) / 50); // 1 weight per 50 turns over 50
    }

    return weight;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(userId);
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter(10, 60 * 1000);

/**
 * Rate limit middleware function
 */
export function rateLimit(userId: string, complexity: number = 1): {
  allowed: true;
} | {
  allowed: false;
  response: NextResponse;
} {
  const result = rateLimiter.checkLimit(userId, complexity);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': result.retryAfter.toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    };
  }

  return { allowed: true };
}

export { rateLimiter };
export type { RateLimitEntry };

