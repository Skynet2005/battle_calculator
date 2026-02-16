import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom API error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles API errors and returns appropriate responses
 *
 * @param error - The error to handle
 * @returns NextResponse with error details
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known API errors
  if (error instanceof ApiError) {
    const response: { error: string; code?: string; details?: unknown } = {
      error: error.message,
    };

    if (error.code) {
      response.code = error.code;
    }

    if (error.details) {
      response.details = error.details;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle validation errors (Zod errors)
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: (error as { issues: unknown[] }).issues,
      },
      { status: 400 }
    );
  }

  // Log unexpected errors but don't expose details to client
  console.error('Unexpected API error:', error);

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Wraps an API route handler with error handling
 *
 * @param handler - The route handler function
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```ts
 * export const POST = withErrorHandling(async (req: NextRequest) => {
 *   // Your handler logic
 * });
 * ```
 */
export function withErrorHandling<T extends NextRequest>(
  handler: (req: T, ctx?: unknown) => Promise<NextResponse>
) {
  return async (req: T, ctx?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
