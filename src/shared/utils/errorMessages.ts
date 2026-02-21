/**
 * User-friendly error messages for API and validation errors.
 * Use at API boundaries and in UI to show consistent, non-technical messages.
 */

export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  NETWORK_ERROR: 'Connection failed. Please check your internet.',
  UNAUTHORIZED: 'Please log in to continue.',
  MISSING_TOKEN: 'Please log in to continue.',
  INVALID_TOKEN: 'Your session may have expired. Please log in again.',
  FORBIDDEN: 'You don\'t have permission to do that.',
  NOT_FOUND: 'The requested item was not found.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  INTERNAL: 'An unexpected error occurred. Please try again.',
};

/**
 * Returns a user-friendly message for an error.
 * Prefers ERROR_MESSAGES by code when available; otherwise uses message or fallback.
 */
export function getUserFriendlyError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: string }).code === 'string') {
    const code = (error as { code: string }).code;
    if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return ERROR_MESSAGES.INTERNAL;
}
