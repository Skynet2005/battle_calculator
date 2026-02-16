import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db, migrationsReady } from '@/server/db/db';
import { profiles, userSettings } from '@/server/db/schema';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';
import { validateBody } from '@/server/middleware/validateSchema';
import { profileStateSchema } from '@/server/validation/schemas';
import { logger } from '@/server/utils/logger';

export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  // Direct database query - unstable_cache can be unreliable in API routes
  // The HTTP cache headers provide client-side caching which is sufficient
  const row = await db
    .select({ currentProfileId: userSettings.currentProfileId })
    .from(userSettings)
    .where(eq(userSettings.userId, auth.userId))
    .limit(1);

  // Add short private cache for profile state
  // max-age: 30 seconds - short cache since state can change
  // private: only cacheable by user's browser, not CDN
  return NextResponse.json(
    { currentProfileId: row[0]?.currentProfileId ?? null },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(profileStateSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { currentProfileId } = validation.data;

  // Validate that if a profileId is provided, it exists and belongs to the user
  if (currentProfileId !== null) {
    const profileRow = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.id, currentProfileId), eq(profiles.userId, auth.userId)))
      .limit(1);

    if (profileRow.length === 0) {
      throw new ApiError(404, 'Profile not found', 'NOT_FOUND');
    }
  }

  const existing = await db
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(eq(userSettings.userId, auth.userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userSettings).values({ userId: auth.userId, currentProfileId });
  } else {
    await db
      .update(userSettings)
      .set({ currentProfileId, updatedAt: new Date() })
      .where(eq(userSettings.userId, auth.userId));
  }

  // Invalidate cache after successful update
  try {
    revalidateTag('user-settings', 'max');
    revalidateTag('profiles', 'max');
  } catch {
    // Cache invalidation failed, but operation succeeded
  }

  logger.info('Profile state updated', { userId: auth.userId, currentProfileId });

  return NextResponse.json({ ok: true });
});
