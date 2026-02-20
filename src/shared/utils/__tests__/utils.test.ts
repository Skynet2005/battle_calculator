/**
 * Unit tests for shared utility functions.
 */

import { describe, expect, it } from 'vitest';
import { formatName, containsProfanity } from '../utils';

describe('formatName', () => {
  it('returns "Anonymous User" for empty/undefined input', () => {
    expect(formatName(undefined)).toBe('Anonymous User');
    expect(formatName('')).toBe('Anonymous User');
  });

  it('returns single name unchanged', () => {
    expect(formatName('Alice')).toBe('Alice');
  });

  it('formats two-part name to "First L." format', () => {
    expect(formatName('Alice Wonderland')).toBe('Alice W.');
  });

  it('formats multi-part name using first and last initial', () => {
    expect(formatName('John Michael Smith')).toBe('John S.');
  });

  it('trims whitespace', () => {
    expect(formatName('  Alice  Wonderland  ')).toBe('Alice W.');
  });
});

describe('containsProfanity', () => {
  it('returns false for clean text', () => {
    expect(containsProfanity('hello world')).toBe(false);
    expect(containsProfanity('game player 123')).toBe(false);
  });

  it('detects common profanity', () => {
    expect(containsProfanity('what the fuck')).toBe(true);
    expect(containsProfanity('shit')).toBe(true);
  });
});
