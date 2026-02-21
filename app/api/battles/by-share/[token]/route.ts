import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleResults } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { buildDiscordSummary } from '@/server/utils/discordSummary';

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
 * GET /api/battles/by-share/:token
 *
 * Resolve a battle result by share token (public, no auth).
 * Returns same shape as GET /api/battles/:id including discordSummary.
 */
export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  await migrationsReady;
  const params = (ctx as { params?: Promise<{ token: string }> })?.params;
  if (!params) {
    throw new ApiError(400, 'Missing route parameters');
  }
  const { token } = await params;

  const [row] = await db
    .select(fullSelect)
    .from(battleResults)
    .where(eq(battleResults.shareToken, token))
    .limit(1);

  if (!row) {
    throw new ApiError(404, 'Battle result not found', 'NOT_FOUND');
  }

  const discordSummary = buildDiscordSummary(row.responseSummaryJson, row.rallyConfigSnapshot);
  return NextResponse.json({ ...row, discordSummary });
});
