import { and, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { profiles, userSettings } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';
import { profileMutationLimiter } from '@/server/middleware/rateLimit';
import { validateBody } from '@/server/middleware/validateSchema';
import { logger } from '@/server/utils/logger';
import { updateProfileSchema } from '@/server/validation/schemas';
import { containsProfanity } from '@/shared/utils/utils';

export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  await migrationsReady;
  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { id } = await params;
  const auth = await requireAuth(req);

  const [row] = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      data: profiles.data,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.userId, auth.userId)))
    .limit(1);

  if (!row) {
    throw new ApiError(404, 'Profile not found', 'NOT_FOUND');
  }

  // Add short private cache for individual profile
  // max-age: 30 seconds - short cache since profiles can change
  // private: only cacheable by user's browser, not CDN
  return NextResponse.json(row, {
    headers: {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    },
  });
});

export const PUT = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  profileMutationLimiter(req);
  await migrationsReady;
  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { id } = await params;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(updateProfileSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { name, data, setCurrent } = validation.data;

  // Check for profanity in profile name if provided
  if (name && containsProfanity(name)) {
    throw new ApiError(400, 'Profile name contains inappropriate content');
  }

  const [row] = await db
    .update(profiles)
    .set({
      name: name ?? undefined,
      data: data ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(profiles.id, id), eq(profiles.userId, auth.userId)))
    .returning({
      id: profiles.id,
      name: profiles.name,
      data: profiles.data,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    });

  if (!row) {
    throw new ApiError(404, 'Profile not found', 'NOT_FOUND');
  }

  if (setCurrent) {
    await upsertCurrentProfile(auth.userId, row.id);
  }

  // Invalidate cache after successful update
  try {
    revalidateTag('profiles', 'max');
    revalidateTag('user-settings', 'max');
  } catch {
    // Cache invalidation failed, but operation succeeded
  }

  logger.info('Profile updated successfully', { userId: auth.userId, profileId: row.id });

  return NextResponse.json(row);
});

export const DELETE = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  profileMutationLimiter(req);
  await migrationsReady;
  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { id } = await params;
  const auth = await requireAuth(req);

  const deleted = await db
    .delete(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.userId, auth.userId)))
    .returning({ id: profiles.id });

  if (deleted.length === 0) {
    throw new ApiError(404, 'Profile not found', 'NOT_FOUND');
  }

  // Clear current profile if it was deleted
  await db
    .update(userSettings)
    .set({ currentProfileId: null, updatedAt: new Date() })
    .where(and(eq(userSettings.userId, auth.userId), eq(userSettings.currentProfileId, id)));

  // Invalidate cache after successful deletion
  try {
    revalidateTag('profiles', 'max');
    revalidateTag('user-settings', 'max');
  } catch {
    // Cache invalidation failed, but operation succeeded
  }

  logger.info('Profile deleted successfully', { userId: auth.userId, profileId: id });

  return NextResponse.json({ ok: true });
});

async function upsertCurrentProfile(userId: string, profileId: string | null) {
  const existing = await db
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userSettings).values({ userId, currentProfileId: profileId });
  } else {
    await db
      .update(userSettings)
      .set({ currentProfileId: profileId, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  }
}

