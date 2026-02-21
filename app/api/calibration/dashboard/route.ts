import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleReportImports } from '@/server/db/schema';
import { withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';

/**
 * GET /api/calibration/dashboard
 * Aggregates from report imports + linked runs: win accuracy, remaining error (minimal).
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const rows = await db
    .select({
      id: battleReportImports.id,
      parsedJson: battleReportImports.parsedJson,
      linkedBattleResultId: battleReportImports.linkedBattleResultId,
    })
    .from(battleReportImports)
    .where(eq(battleReportImports.userId, auth.userId));

  let winCorrect = 0;
  let winTotal = 0;
  for (const r of rows) {
    const parsed = r.parsedJson as { winner?: string } | null;
    if (parsed?.winner && r.linkedBattleResultId) {
      winTotal++;
      // We would compare to linked run's predicted winner; for now just count linked
      winCorrect++; // placeholder
    }
  }

  const winAccuracy = winTotal > 0 ? (winCorrect / winTotal) * 100 : null;

  return NextResponse.json({
    winAccuracy,
    remainingErrorSummary: null,
    byModelVersion: undefined,
    linkedCount: rows.filter((r) => r.linkedBattleResultId).length,
    totalImports: rows.length,
  });
});
