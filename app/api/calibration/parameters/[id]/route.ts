import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { calibrationParameters } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';

/**
 * PATCH /api/calibration/parameters/:id
 * Update name, params, or is_active. If setting is_active true, clear others for this user.
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

  const updates: { name?: string; paramsJson?: Record<string, unknown>; isActive?: boolean } = {};
  if (typeof body.name === 'string') updates.name = body.name;
  if (body.paramsJson && typeof body.paramsJson === 'object') updates.paramsJson = body.paramsJson;
  if (typeof body.isActive === 'boolean') {
    updates.isActive = body.isActive;
    if (body.isActive) {
      await db
        .update(calibrationParameters)
        .set({ isActive: false })
        .where(eq(calibrationParameters.userId, auth.userId));
    }
  }

  const [row] = await db
    .update(calibrationParameters)
    .set(updates)
    .where(and(eq(calibrationParameters.id, id), eq(calibrationParameters.userId, auth.userId)))
    .returning();

  if (!row) {
    throw new ApiError(404, 'Calibration parameters not found', 'NOT_FOUND');
  }

  return NextResponse.json(row);
});
