import bcrypt from 'bcryptjs';
import { and, eq, ne } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions, clearAuthCookie, signAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { users } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';
import { validateBody } from '@/server/middleware/validateSchema';
import { logger } from '@/server/utils/logger';
import { updateUserSchema } from '@/server/validation/schemas';
import { containsProfanity } from '@/shared/utils/utils';

export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const userResult = await db
    .select({ id: users.id, email: users.email, username: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  const user = userResult[0];
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Add short private cache for user profile data
  // max-age: 30 seconds - short cache for user data
  // private: only cacheable by user's browser, not CDN
  return NextResponse.json(user, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    },
  });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(updateUserSchema, body);
  if (!validation.success) {
    logger.error('Validation failed', undefined, { errors: validation.errors });
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { username, email, currentPassword, newPassword } = validation.data;

  // If changing password, verify current password first
  if (newPassword && newPassword.trim().length > 0) {
    if (!currentPassword || currentPassword.trim().length === 0) {
      throw new ApiError(400, 'Current password is required', 'MISSING_CURRENT_PASSWORD');
    }

    // Get current user's password hash
    const userResult = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const user = userResult[0];
    if (!user || !user.password) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }
  }

  // Check for profanity in username if provided
  if (username && containsProfanity(username)) {
    throw new ApiError(400, 'Username contains inappropriate content');
  }

  // Check if username is already taken (if changing username)
  if (username) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.name, username), ne(users.id, auth.userId)))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ApiError(409, 'Username already taken', 'USERNAME_EXISTS');
    }
  }

  // Check if email is already taken (if changing email)
  if (email) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, auth.userId)))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ApiError(409, 'Email already taken', 'EMAIL_EXISTS');
    }
  }

  // Build update object
  const updateData: { name?: string; email?: string; password?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (username !== undefined) {
    updateData.name = username;
  }

  if (email !== undefined) {
    updateData.email = email;
  }

  const shouldUpdatePassword = newPassword && newPassword.trim().length > 0;

  if (shouldUpdatePassword) {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    updateData.password = hashedPassword;
    logger.info('Password update initiated', {
      userId: auth.userId,
      hasPassword: !!updateData.password,
      passwordLength: hashedPassword.length
    });
  }

  // Only update if there's something to update (besides updatedAt)
  const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updatedAt');
  if (fieldsToUpdate.length === 0) {
    throw new ApiError(400, 'No fields to update');
  }

  logger.info('Updating user fields', {
    userId: auth.userId,
    fields: fieldsToUpdate,
    hasPassword: updateData.password !== undefined,
    passwordInUpdateData: 'password' in updateData,
    updateDataKeys: Object.keys(updateData),
    updateDataValues: Object.keys(updateData).reduce((acc, key) => {
      acc[key] = key === 'password' ? '[REDACTED]' : updateData[key as keyof typeof updateData];
      return acc;
    }, {} as Record<string, unknown>)
  });

  // Build setData object - ensure password is explicitly included
  const setData: { name?: string; email?: string; password?: string; updatedAt: Date } = {
    updatedAt: updateData.updatedAt,
  };

  if (updateData.name !== undefined) {
    setData.name = updateData.name;
  }

  if (updateData.email !== undefined) {
    setData.email = updateData.email;
  }

  // CRITICAL: Ensure password is included if it should be updated
  if (shouldUpdatePassword && updateData.password) {
    setData.password = updateData.password;
    logger.info('Password included in update', {
      userId: auth.userId,
      passwordHashLength: updateData.password.length,
      passwordHashPreview: updateData.password.substring(0, 20) + '...'
    });
  }

  // Log what will be updated
  logger.info('Database update payload', {
    userId: auth.userId,
    setDataKeys: Object.keys(setData),
    hasPassword: 'password' in setData,
    passwordInSetData: setData.password !== undefined,
    setDataPasswordLength: setData.password?.length || 0
  });

  const [updated] = await db
    .update(users)
    .set(setData)
    .where(eq(users.id, auth.userId))
    .returning({
      id: users.id,
      email: users.email,
      username: users.name,
      role: users.role,
    });

  if (!updated) {
    logger.error('Failed to update user', undefined, { userId: auth.userId });
    throw new ApiError(500, 'Failed to update user');
  }

  // Verify password was updated if it was supposed to be
  if (shouldUpdatePassword && updateData.password) {
    try {
      // Wait a bit longer to ensure database write is committed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Re-query to get the actual saved password
      const verifyResult = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, auth.userId))
        .limit(1);

      if (!verifyResult[0]) {
        logger.error('CRITICAL: User not found after password update', undefined, { userId: auth.userId });
      } else if (!verifyResult[0].password) {
        logger.error('CRITICAL: Password not found in database after update', undefined, {
          userId: auth.userId,
          userExists: true,
          savedPasswordHash: setData.password?.substring(0, 20) + '...'
        });
      } else {
        // Verify the new password matches what we just saved
        const passwordMatches = await bcrypt.compare(newPassword.trim(), verifyResult[0].password);
        if (passwordMatches) {
          logger.info('✅ Password update verified successfully', {
            userId: auth.userId,
            passwordHashLength: verifyResult[0].password.length
          });
        } else {
          // This is a critical issue - password was saved but doesn't match
          const oldPasswordWorks = await bcrypt.compare(currentPassword!.trim(), verifyResult[0].password);
          logger.error('❌ CRITICAL: Password saved but verification failed', undefined, {
            userId: auth.userId,
            passwordHashLength: verifyResult[0].password.length,
            newPasswordLength: newPassword.trim().length,
            oldPasswordStillWorks: oldPasswordWorks,
            savedHashPreview: verifyResult[0].password.substring(0, 20) + '...',
            expectedHashPreview: setData.password?.substring(0, 20) + '...'
          });
        }
      }
    } catch (error) {
      logger.error('Password verification error', error as Error, {
        userId: auth.userId
      });
    }
  }

  // Generate new token with updated info (always generate to ensure fresh token)
  const token = await signAuthToken({
    id: updated.id,
    email: updated.email,
    username: updated.username ?? '',
  });

  const res = NextResponse.json(updated, { status: 200 });

  // Set the auth cookie - use same pattern as login/register
  res.cookies.set({ ...authCookieOptions(), value: token });

  logger.info('User profile updated', { userId: auth.userId });

  return res;
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  await db.delete(users).where(eq(users.id, auth.userId));

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(clearAuthCookie());

  logger.info('User account deleted', { userId: auth.userId });

  return res;
});

