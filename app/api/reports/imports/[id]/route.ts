import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleReportImports } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';

/**
 * PATCH /api/reports/imports/:id
 * Link or unlink a battle result for comparison.
 */
export const PATCH = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  await migrationsReady;
  const auth = await requireAuth(req);
  const params = (ctx as { params?: Promise<{ id: string }> })?.params;
  if (!params) throw new ApiError(400, 'Missing route parameters');
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const linkedBattleResultId = body.linkedBattleResultId === null || typeof body.linkedBattleResultId === 'string'
    ? body.linkedBattleResultId
    : undefined;

  const [row] = await db
    .update(battleReportImports)
    .set({ linkedBattleResultId: linkedBattleResultId ?? null })
    .where(and(eq(battleReportImports.id, id), eq(battleReportImports.userId, auth.userId)))
    .returning({
      id: battleReportImports.id,
      linkedBattleResultId: battleReportImports.linkedBattleResultId,
    });

  if (!row) {
    throw new ApiError(404, 'Report import not found', 'NOT_FOUND');
  }

  return NextResponse.json(row);
});
