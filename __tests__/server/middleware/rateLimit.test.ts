import { rateLimiter } from '@/server/middleware/rateLimit';
import { beforeEach, describe, expect, it } from 'vitest';

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset rate limiter state
    rateLimiter.destroy();
    // Recreate (in a real implementation, you'd want a way to reset without destroy)
  });

  it('should allow requests within limit', () => {
    const userId = 'test-user-1';
    const result1 = rateLimiter.checkLimit(userId, 1);
    expect(result1.allowed).toBe(true);

    const result2 = rateLimiter.checkLimit(userId, 1);
    expect(result2.allowed).toBe(true);
  });

  it('should calculate complexity correctly', () => {
    expect(rateLimiter.calculateComplexity({})).toBe(1);
    expect(rateLimiter.calculateComplexity({ simulations: 100 })).toBe(2); // 1 + ceil(100/100) = 1 + 1 = 2
    expect(rateLimiter.calculateComplexity({ simulations: 200 })).toBe(3); // 1 + ceil(200/100) = 1 + 2 = 3
    expect(rateLimiter.calculateComplexity({ maxTurns: 100 })).toBe(2); // 1 + ceil((100-50)/50) = 1 + 1 = 2
    expect(rateLimiter.calculateComplexity({ simulations: 150, maxTurns: 150 })).toBe(5); // 1 + ceil(150/100) + ceil((150-50)/50) = 1 + 2 + 2 = 5
  });

  it('should reject requests exceeding limit', () => {
    const userId = 'test-user-2';

    // Make 10 requests (at limit)
    for (let i = 0; i < 10; i++) {
      const result = rateLimiter.checkLimit(userId, 1);
      expect(result.allowed).toBe(true);
    }

    // 11th request should be rejected
    const result = rateLimiter.checkLimit(userId, 1);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfter).toBeGreaterThan(0);
    }
  });
});
