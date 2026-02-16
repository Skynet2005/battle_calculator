import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { db, migrationsReady } from '@/server/db/db';
import { containsProfanity } from '@/shared/utils/utils';
import { profiles, userSettings } from '@/server/db/schema';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';
import { validateBody } from '@/server/middleware/validateSchema';
import { createProfileSchema } from '@/server/validation/schemas';
import { logger } from '@/server/utils/logger';
import { getCachedProfilesWithCurrent } from '@/server/db/cache';
import { rateLimit } from '@/server/middleware/rateLimit';

// Rate limit: 10 requests per minute for profile creation
const createProfileRateLimit = rateLimit(10, 60 * 1000);

export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  // Check if we need to bypass cache (when _t query param is present)
  const bypassCache = req.nextUrl.searchParams.has('_t');

  let rows, currentProfileId;

  if (bypassCache) {
    // Bypass cache and query directly from database for fresh data
    // This is used after create/delete operations to get immediate updates
    const profilesResult = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(eq(profiles.userId, auth.userId));

    const settingsResult = await db
      .select({ currentProfileId: userSettings.currentProfileId })
      .from(userSettings)
      .where(eq(userSettings.userId, auth.userId))
      .limit(1);

    rows = profilesResult;
    currentProfileId = settingsResult[0]?.currentProfileId ?? null;
  } else {
    // Use optimized cached query with JOIN instead of two separate queries
    const result = await getCachedProfilesWithCurrent(auth.userId);
    rows = result.profiles;
    currentProfileId = result.currentProfileId;
  }

  // Add short private cache for user profiles
  // Server-side caching already handles most of this, but HTTP cache helps with edge/CDN
  // max-age: 30 seconds - short cache since profiles can change
  // private: only cacheable by user's browser, not CDN
  return NextResponse.json(
    {
      profiles: rows,
      currentProfileId,
    },
    {
      headers: {
        'Cache-Control': bypassCache
          ? 'no-cache, no-store, must-revalidate' // No cache when bypassing
          : 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  // Apply rate limiting
  const rateLimitResponse = createProfileRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(createProfileSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { name, data, setCurrent } = validation.data;

  // Check for profanity in profile name
  if (containsProfanity(name)) {
    throw new ApiError(400, 'Profile name contains inappropriate content');
  }

  // Use transaction to ensure atomicity and optimize database operations
  const [row] = await db.transaction(async (tx) => {
    const [newProfile] = await tx
      .insert(profiles)
      .values({ userId: auth.userId, name, data })
      .returning({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      });

    if (!newProfile) {
      throw new Error('Failed to create profile');
    }

    // Update current profile in the same transaction if needed
    if (setCurrent) {
      await upsertCurrentProfileInTransaction(tx, auth.userId, newProfile.id);
    }

    return [newProfile];
  });

  if (!row) {
    logger.error('Failed to create profile', undefined, { userId: auth.userId, name });
    throw new ApiError(500, 'Failed to create profile');
  }

  // Invalidate cache after successful creation
  try {
    revalidateTag('profiles', 'max');
    revalidateTag('user-settings', 'max');
  } catch {
    // Cache invalidation failed, but operation succeeded
  }

  logger.info('Profile created successfully', { userId: auth.userId, profileId: row.id });

  return NextResponse.json(row, { status: 201 });
});

/**
 * Upsert current profile (standalone version for non-transaction contexts)
 */
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

/**
 * Upsert current profile within a transaction (optimized version)
 */
async function upsertCurrentProfileInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  profileId: string | null
) {
  const existing = await tx
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await tx.insert(userSettings).values({ userId, currentProfileId: profileId });
  } else {
    await tx
      .update(userSettings)
      .set({ currentProfileId: profileId, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  }
}
