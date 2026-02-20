import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleResults } from '@/server/db/schema';
import { requireAuth } from '@/server/middleware/auth';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { createRateLimiter } from '@/server/middleware/rateLimit';
import { logger } from '@/server/utils/logger';

const battleMutationLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});

/**
 * GET /api/battles/:id
 *
 * Retrieve a specific battle result by ID.
 * Only returns results belonging to the authenticated user.
 */
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
      id: battleResults.id,
      createdAt: battleResults.createdAt,
      inputHash: battleResults.inputHash,
      requestJson: battleResults.requestJson,
      responseSummaryJson: battleResults.responseSummaryJson,
      timelineJson: battleResults.timelineJson,
      metricsJson: battleResults.metricsJson,
      rationaleJson: battleResults.rationaleJson,
      reportJson: battleResults.reportJson,
    })
    .from(battleResults)
    .where(and(eq(battleResults.id, id), eq(battleResults.userId, auth.userId)))
    .limit(1);

  if (!row) {
    throw new ApiError(404, 'Battle result not found', 'NOT_FOUND');
  }

  return NextResponse.json(row);
});

/**
 * DELETE /api/battles/:id
 *
 * Delete a specific battle result by ID.
 * Only deletes results belonging to the authenticated user.
 */
export const DELETE = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  battleMutationLimiter(req);
  await migrationsReady;
  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { id } = await params;
  const auth = await requireAuth(req);

  const deleted = await db
    .delete(battleResults)
    .where(and(eq(battleResults.id, id), eq(battleResults.userId, auth.userId)))
    .returning({ id: battleResults.id });

  if (deleted.length === 0) {
    throw new ApiError(404, 'Battle result not found', 'NOT_FOUND');
  }

  logger.info('Battle result deleted', { userId: auth.userId, battleId: id });

  return NextResponse.json({ ok: true });
});
