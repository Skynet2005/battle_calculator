import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { battleReportImports } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { requireAuth } from '@/server/middleware/auth';
import { validateBody } from '@/server/middleware/validateSchema';
import { parseReportText } from '@/server/utils/parseReportText';
import { reportImportSchema } from '@/server/validation/schemas';

/**
 * POST /api/reports/import
 * Paste raw report text; parse and store. Returns id, rawText, parsed, errors.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(reportImportSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { rawText } = validation.data;
  const { parsed, errors } = parseReportText(rawText);

  const [row] = await db
    .insert(battleReportImports)
    .values({
      userId: auth.userId,
      rawText,
      parsedJson: parsed as unknown as Record<string, unknown>,
    })
    .returning({
      id: battleReportImports.id,
      rawText: battleReportImports.rawText,
      parsedJson: battleReportImports.parsedJson,
      createdAt: battleReportImports.createdAt,
    });

  if (!row) {
    throw new ApiError(500, 'Failed to save report import');
  }

  return NextResponse.json({
    id: row.id,
    rawText: row.rawText,
    parsed: row.parsedJson ?? parsed,
    errors: errors.length ? errors : undefined,
  }, { status: 201 });
});
