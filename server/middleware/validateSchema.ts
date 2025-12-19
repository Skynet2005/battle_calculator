import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

/**
 * Zod validation helper for route handlers.
 * Provides type-safe request validation.
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  query: Record<string, string | string[] | undefined>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const data = schema.parse(query);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}

/**
 * Creates a validation middleware function for route handlers
 */
export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest): Promise<
    | { valid: true; data: T }
    | { valid: false; response: NextResponse }
  > => {
    const body = await req.json().catch(() => null);
    const result = validateBody(schema, body);

    if (!result.success) {
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: result.errors,
          },
          { status: 400 }
        ),
      };
    }

    return { valid: true, data: result.data };
  };
}
