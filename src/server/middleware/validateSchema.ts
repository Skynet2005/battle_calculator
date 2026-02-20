import { ZodSchema } from 'zod';

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; errors: string[] };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const formatErrors = (errors: string[]): ValidationFailure => ({
  success: false,
  errors,
});

export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message);
    return formatErrors(errors);
  }
  return { success: true, data: result.data };
}

export function validateQuery<T>(
  schema: ZodSchema<T>,
  query: Record<string, unknown>
): ValidationResult<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message);
    return formatErrors(errors);
  }
  return { success: true, data: result.data as T };
}
