/**
 * Unit tests for validateBody and validateQuery
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery } from '../validateSchema';

const simpleSchema = z.object({
  name: z.string(),
  count: z.number(),
});

describe('validateBody', () => {
  it('returns success and data for valid input', () => {
    const result = validateBody(simpleSchema, { name: 'foo', count: 42 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'foo', count: 42 });
    }
  });

  it('returns failure with errors for invalid input', () => {
    const result = validateBody(simpleSchema, { name: 'foo', count: 'not-a-number' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns failure for wrong types', () => {
    const result = validateBody(simpleSchema, { name: 123, count: 42 });
    expect(result.success).toBe(false);
  });

  it('returns failure for missing fields', () => {
    const result = validateBody(simpleSchema, {});
    expect(result.success).toBe(false);
  });
});

describe('validateQuery', () => {
  const querySchema = z.object({
    page: z.coerce.number().optional().default(1),
    q: z.string().optional(),
  });

  it('returns success and parsed data for valid query', () => {
    const result = validateQuery(querySchema, { page: '2', q: 'search' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.q).toBe('search');
    }
  });

  it('applies default for missing optional field', () => {
    const result = validateQuery(querySchema, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it('returns failure for invalid query value', () => {
    const result = validateQuery(querySchema, { page: 'not-a-number' });
    expect(result.success).toBe(false);
  });
});
