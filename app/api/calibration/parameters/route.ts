import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { calibrationParameters } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';
import { validateBody } from '@/server/middleware/validateSchema';
import { calibrationParamsSchema } from '@/server/validation/schemas';

/**
 * GET /api/calibration/parameters
 * List calibration parameter sets for current user; mark is_active.
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const rows = await db
    .select()
    .from(calibrationParameters)
    .where(eq(calibrationParameters.userId, auth.userId))
    .orderBy(calibrationParameters.createdAt);

  return NextResponse.json({ items: rows });
});

/**
 * POST /api/calibration/parameters
 * Create a new calibration parameter set.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(calibrationParamsSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { version, name, paramsJson, isActive } = validation.data;

  const [row] = await db
    .insert(calibrationParameters)
    .values({
      userId: auth.userId,
      version,
      name,
      paramsJson: paramsJson as Record<string, unknown>,
      isActive: isActive ?? false,
    })
    .returning();

  if (!row) {
    throw new ApiError(500, 'Failed to create calibration parameters');
  }

  return NextResponse.json(row, { status: 201 });
});
