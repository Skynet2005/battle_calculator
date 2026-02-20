import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { profiles } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';

/**
 * GET /api/profiles/public/[id]
 *
 * Retrieve a profile by ID if it is marked as public.
 * No authentication required.
 */
export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  await migrationsReady;

  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { id } = await params;

  const [row] = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      data: profiles.data,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(
      and(
        eq(profiles.id, id),
        eq(profiles.isPublic, true),
        isNull(profiles.deletedAt)
      )
    )
    .limit(1);

  if (!row) {
    throw new ApiError(404, 'Profile not found or not public', 'NOT_FOUND');
  }

  return NextResponse.json(row, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    },
  });
});
