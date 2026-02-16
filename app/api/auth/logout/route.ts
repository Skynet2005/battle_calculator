import { NextResponse } from 'next/server';

import { clearAuthCookie } from '@/server/auth/auth';
import { withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { logger } from '@/server/utils/logger';
import { optionalAuth } from '@/server/middleware/auth';
import { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const auth = await optionalAuth(req);

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(clearAuthCookie());

  if (auth) {
    logger.info('User logged out', { userId: auth.userId });
  }

  return res;
});

