import { validateBody, validateQuery } from '@/server/middleware/validateSchema';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('validateSchema', () => {
  describe('validateBody', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    });

    it('should validate valid body', () => {
      const result = validateBody(TestSchema, { name: 'Test', age: 25 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test', age: 25 });
      }
    });

    it('should reject invalid body', () => {
      const result = validateBody(TestSchema, { name: '', age: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject missing fields', () => {
      const result = validateBody(TestSchema, { name: 'Test' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateQuery', () => {
    const TestQuerySchema = z.object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    });

    it('should validate valid query', () => {
      const result = validateQuery(TestQuerySchema, { page: '1', limit: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ page: 1, limit: 10 });
      }
    });

    it('should handle missing optional fields', () => {
      const result = validateQuery(TestQuerySchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('should reject invalid query', () => {
      const result = validateQuery(TestQuerySchema, { page: '-1', limit: '200' });
      expect(result.success).toBe(false);
    });
  });
});
