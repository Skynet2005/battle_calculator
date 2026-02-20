import bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions, signAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { users } from '@/server/db/schema';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';
import { authLoginLimiter } from '@/server/middleware/rateLimit';
import { validateBody } from '@/server/middleware/validateSchema';
import { loginSchema } from '@/server/validation/schemas';
import { logger } from '@/server/utils/logger';

export const POST = withErrorHandling(async (req: NextRequest) => {
  authLoginLimiter(req);
  await migrationsReady;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(loginSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { username, password } = validation.data;

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.name,
      password: users.password,
    })
    .from(users)
    .where(or(eq(users.email, username), eq(users.name, username)))
    .limit(1);

  const user = userResult[0];

  if (!user || !user.password) {
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const token = await signAuthToken({
    id: user.id,
    email: user.email,
    username: user.username ?? username,
  });

  const res = NextResponse.json(
    {
      id: user.id,
      email: user.email,
      username: user.username ?? username,
    },
    { status: 200 },
  );

  res.cookies.set({ ...authCookieOptions(), value: token });

  logger.info('User logged in successfully', { userId: user.id });

  return res;
});

