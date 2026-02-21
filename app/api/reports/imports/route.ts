import { and, desc, eq, lt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleReportImports } from '@/server/db/schema';
import { withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';

/**
 * GET /api/reports/imports
 * List current user's report imports with cursor pagination.
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const limitParam = req.nextUrl.searchParams.get('limit');
  const cursorParam = req.nextUrl.searchParams.get('cursor');
  const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);

  const conditions = [eq(battleReportImports.userId, auth.userId)];
  if (cursorParam) {
    const cursorDate = new Date(cursorParam);
    if (!isNaN(cursorDate.getTime())) {
      conditions.push(lt(battleReportImports.createdAt, cursorDate));
    }
  }

  const rows = await db
    .select({
      id: battleReportImports.id,
      rawText: battleReportImports.rawText,
      parsedJson: battleReportImports.parsedJson,
      linkedBattleResultId: battleReportImports.linkedBattleResultId,
      createdAt: battleReportImports.createdAt,
    })
    .from(battleReportImports)
    .where(and(...conditions))
    .orderBy(desc(battleReportImports.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem && lastItem.createdAt ? lastItem.createdAt.toISOString() : null;

  return NextResponse.json({ items, nextCursor, hasMore });
});
