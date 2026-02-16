import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/server/auth/auth';
import { ApiError } from './apiErrorHandler';

export interface AuthResult {
  userId: string;
  email: string;
  username: string;
}

/**
 * Requires authentication for an API route
 *
 * @param req - The Next.js request object
 * @returns AuthResult if authenticated, or throws ApiError if not
 *
 * @throws {ApiError} If authentication fails
 *
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const auth = await requireAuth(req);
 *   // Use auth.userId, auth.email, auth.username
 * }
 * ```
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    throw new ApiError(401, 'Unauthorized', 'MISSING_TOKEN');
  }

  try {
    const payload = await verifyAuthToken(token);
    return {
      userId: payload.id,
      email: payload.email,
      username: payload.username,
    };
  } catch (err) {
    throw new ApiError(401, 'Unauthorized', 'INVALID_TOKEN');
  }
}

/**
 * Optional authentication - returns auth info if token is present and valid
 *
 * @param req - The Next.js request object
 * @returns AuthResult if authenticated, null if not authenticated (but no error)
 */
export async function optionalAuth(req: NextRequest): Promise<AuthResult | null> {
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    return {
      userId: payload.id,
      email: payload.email,
      username: payload.username,
    };
  } catch {
    return null;
  }
}
