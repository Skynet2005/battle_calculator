import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleResults } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';
import { createRateLimiter } from '@/server/middleware/rateLimit';
import { buildDiscordSummary } from '@/server/utils/discordSummary';
import { logger } from '@/server/utils/logger';

const battleMutationLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});

const fullSelect = {
  id: battleResults.id,
  createdAt: battleResults.createdAt,
  inputHash: battleResults.inputHash,
  requestJson: battleResults.requestJson,
  responseSummaryJson: battleResults.responseSummaryJson,
  timelineJson: battleResults.timelineJson,
  metricsJson: battleResults.metricsJson,
  rationaleJson: battleResults.rationaleJson,
  reportJson: battleResults.reportJson,
  playerProfileId: battleResults.playerProfileId,
  opponentProfileId: battleResults.opponentProfileId,
  rallyConfigSnapshot: battleResults.rallyConfigSnapshot,
  battleConfigSnapshot: battleResults.battleConfigSnapshot,
  tags: battleResults.tags,
  modelVersion: battleResults.modelVersion,
  shareToken: battleResults.shareToken,
  runType: battleResults.runType,
};

/**
 * GET /api/battles/:id
 *
 * Retrieve a specific battle result by ID.
 * - If shareToken query param is provided and matches, returns row without auth (read-only permalink).
 * - Otherwise requires auth and returns only results belonging to the user.
 */
export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  await migrationsReady;
  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { id } = await params;
  const shareToken = req.nextUrl.searchParams.get('shareToken') ?? undefined;

  type Row = {
    id: string;
    createdAt: Date;
    inputHash: string;
    requestJson: unknown;
    responseSummaryJson: unknown;
    timelineJson: unknown;
    metricsJson: unknown;
    rationaleJson: unknown;
    reportJson: unknown;
    playerProfileId: string | null;
    opponentProfileId: string | null;
    rallyConfigSnapshot: unknown;
    battleConfigSnapshot: unknown;
    tags: unknown;
    modelVersion: string | null;
    shareToken: string | null;
    runType: string | null;
  };

  let row: Row | undefined;

  if (shareToken) {
    const [r] = await db
      .select(fullSelect)
      .from(battleResults)
      .where(and(eq(battleResults.id, id), eq(battleResults.shareToken, shareToken)))
      .limit(1);
    row = r as Row | undefined;
  } else {
    const auth = await requireAuth(req);
    const [r] = await db
      .select(fullSelect)
      .from(battleResults)
      .where(and(eq(battleResults.id, id), eq(battleResults.userId, auth.userId)))
      .limit(1);
    row = r as Row | undefined;
  }

  if (!row) {
    throw new ApiError(404, 'Battle result not found', 'NOT_FOUND');
  }

  const discordSummary = buildDiscordSummary(row.responseSummaryJson, row.rallyConfigSnapshot);
  return NextResponse.json({ ...row, discordSummary });
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
