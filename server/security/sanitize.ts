/**
 * Input Sanitization Utilities
 *
 * Functions to sanitize user-provided strings and ensure safe text enforcement.
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * Sanitizes an object recursively, sanitizing all string values
 */
export function sanitizeObject<T>(obj: T, maxLength: number = 1000): T {
  if (typeof obj === 'string') {
    return sanitizeString(obj, maxLength) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxLength)) as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key, 100)] = sanitizeObject(value, maxLength);
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Validates that a string contains only safe characters
 */
export function isSafeString(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  // Check for null bytes or control characters (except newlines and tabs)
  if (/\0|[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
    return false;
  }

  return true;
}

/**
 * Sanitizes a number to ensure it's within safe bounds
 */
export function sanitizeNumber(
  input: unknown,
  min: number = -Number.MAX_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number {
  const num = typeof input === 'number' ? input : Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }

  return Math.max(min, Math.min(max, num));
}
