/**
 * Unit tests for validation utilities.
 */

import { describe, expect, it } from 'vitest';
import { isUuid } from '../validation';

describe('isUuid', () => {
  it('returns true for valid UUIDs', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    expect(isUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('returns false for invalid UUIDs', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('12345678-1234-1234-1234-12345678901')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('handles case-insensitive UUIDs', () => {
    expect(isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(isUuid('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
  });
});
