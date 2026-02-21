import { and, desc, eq, lt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleResults } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';
import { createRateLimiter } from '@/server/middleware/rateLimit';
import { validateBody } from '@/server/middleware/validateSchema';
import { logger } from '@/server/utils/logger';
import { saveBattleResultSchema } from '@/server/validation/schemas';

const battleMutationLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});

/**
 * GET /api/battles
 *
 * List the authenticated user's battle history with cursor-based pagination.
 *
 * Query params:
 *   - limit  (number, default 20, max 100)
 *   - cursor (ISO date string – return results created before this timestamp)
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const limitParam = req.nextUrl.searchParams.get('limit');
  const cursorParam = req.nextUrl.searchParams.get('cursor');

  const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);

  const conditions = [eq(battleResults.userId, auth.userId)];

  if (cursorParam) {
    const cursorDate = new Date(cursorParam);
    if (isNaN(cursorDate.getTime())) {
      throw new ApiError(400, 'Invalid cursor: must be an ISO date string');
    }
    conditions.push(lt(battleResults.createdAt, cursorDate));
  }

  const rows = await db
    .select({
      id: battleResults.id,
      createdAt: battleResults.createdAt,
      inputHash: battleResults.inputHash,
      requestJson: battleResults.requestJson,
      responseSummaryJson: battleResults.responseSummaryJson,
      playerProfileId: battleResults.playerProfileId,
      opponentProfileId: battleResults.opponentProfileId,
      rallyConfigSnapshot: battleResults.rallyConfigSnapshot,
      battleConfigSnapshot: battleResults.battleConfigSnapshot,
      tags: battleResults.tags,
      modelVersion: battleResults.modelVersion,
      shareToken: battleResults.shareToken,
      runType: battleResults.runType,
    })
    .from(battleResults)
    .where(and(...conditions))
    .orderBy(desc(battleResults.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].createdAt?.toISOString() : null;

  return NextResponse.json({
    items,
    nextCursor,
    hasMore,
  });
});

/**
 * POST /api/battles
 *
 * Save a new battle result for the authenticated user.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  battleMutationLimiter(req);
  await migrationsReady;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(saveBattleResultSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const {
    inputHash,
    requestJson,
    responseSummaryJson,
    timelineJson,
    metricsJson,
    rationaleJson,
    reportJson,
    playerProfileId,
    opponentProfileId,
    rallyConfigSnapshot,
    battleConfigSnapshot,
    tags,
    modelVersion,
    generateShareToken,
    runType,
  } = validation.data;

  const shareToken =
    generateShareToken === true ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : null;

  const [row] = await db
    .insert(battleResults)
    .values({
      userId: auth.userId,
      inputHash,
      requestJson,
      responseSummaryJson: responseSummaryJson ?? null,
      timelineJson: timelineJson ?? null,
      metricsJson: metricsJson ?? null,
      rationaleJson: rationaleJson ?? null,
      reportJson: reportJson ?? null,
      playerProfileId: playerProfileId ?? null,
      opponentProfileId: opponentProfileId ?? null,
      rallyConfigSnapshot: rallyConfigSnapshot ?? null,
      battleConfigSnapshot: battleConfigSnapshot ?? null,
      tags: tags ?? null,
      modelVersion: modelVersion ?? null,
      shareToken,
      runType: runType ?? null,
    })
    .returning({
      id: battleResults.id,
      createdAt: battleResults.createdAt,
      inputHash: battleResults.inputHash,
      shareToken: battleResults.shareToken,
    });

  if (!row) {
    logger.error('Failed to save battle result', undefined, { userId: auth.userId });
    throw new ApiError(500, 'Failed to save battle result');
  }

  logger.info('Battle result saved', { userId: auth.userId, battleId: row.id });

  return NextResponse.json(row, { status: 201 });
});
