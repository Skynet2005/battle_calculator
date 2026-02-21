/**
 * Input sanitization for API requests.
 * Reduces XSS and data corruption by trimming, stripping HTML-like characters, and limiting length.
 */

const DEFAULT_MAX_LENGTH = 1000;

/**
 * Sanitizes a string: trims, removes angle brackets, and enforces max length.
 */
export function sanitizeString(input: string, maxLength: number = DEFAULT_MAX_LENGTH): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

/**
 * Sanitizes a string for use as a profile or display name (shorter limit).
 */
export function sanitizeProfileName(input: string, maxLength: number = 100): string {
  return sanitizeString(input, maxLength);
}
