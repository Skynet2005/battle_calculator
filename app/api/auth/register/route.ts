import bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions, signAuthToken } from '@/server/auth/auth';
import { containsProfanity } from '@/shared/utils/utils';
import { db, migrationsReady } from '@/server/db/db';
import { users } from '@/server/db/schema';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';
import { authRegisterLimiter } from '@/server/middleware/rateLimit';
import { validateBody } from '@/server/middleware/validateSchema';
import { registerSchema } from '@/server/validation/schemas';
import { logger } from '@/server/utils/logger';

export const POST = withErrorHandling(async (req: NextRequest) => {
  authRegisterLimiter(req);
  await migrationsReady;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(registerSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { email, username, password } = validation.data;

  // Check for profanity in username
  if (containsProfanity(username)) {
    throw new ApiError(400, 'Username contains inappropriate content');
  }

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.name, username)))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(409, 'User already exists', 'USER_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(users)
    .values({
      email,
      name: username,
      password: passwordHash,
      role: 'user',
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.name,
    });

  if (!created) {
    logger.error('Failed to create user', undefined, { email, username });
    throw new ApiError(500, 'Failed to create user');
  }

  const token = await signAuthToken({
    id: created.id,
    email: created.email,
    username: created.username ?? username,
  });

  const res = NextResponse.json(
    {
      id: created.id,
      email: created.email,
      username: created.username ?? username,
    },
    { status: 201 }
  );

  res.cookies.set({ ...authCookieOptions(), value: token });

  logger.info('User registered successfully', { userId: created.id, email });

  return res;
});

