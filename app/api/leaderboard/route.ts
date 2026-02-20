import { NextRequest, NextResponse } from 'next/server';
import { fetchLeaderboardPage } from '@/app/leaderboard/leaderboard-data';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const limitParam = params.get('limit');
  const limit = limitParam !== null ? Number(limitParam) : DEFAULT_LIMIT;
  if (!Number.isFinite(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ApiError(400, 'Invalid limit', 'INVALID_LIMIT', { min: 1, max: MAX_LIMIT });
  }
  const cursor = params.get('cursor') || null;
  if (cursor !== null && cursor !== '') {
    const asDate = new Date(cursor);
    if (Number.isNaN(asDate.getTime())) {
      throw new ApiError(400, 'Invalid cursor', 'INVALID_CURSOR');
    }
  }

  const result = await fetchLeaderboardPage({ limit, cursor });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    },
  });
});
