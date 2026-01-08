import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { verifyAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { profiles, userSettings } from '@/server/db/schema';

export async function GET(req: NextRequest) {
  await migrationsReady;
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id: userId } = await verifyAuthToken(token);

    const row = await db
      .select({ currentProfileId: userSettings.currentProfileId })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return NextResponse.json({ currentProfileId: row[0]?.currentProfileId ?? null });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  await migrationsReady;
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id: userId } = await verifyAuthToken(token);
    const body = await req.json().catch(() => null);
    const { currentProfileId } = (body || {}) as { currentProfileId?: string | null };

    // Validate that if a profileId is provided, it exists and belongs to the user
    if (currentProfileId !== null && currentProfileId !== undefined) {
      if (typeof currentProfileId !== 'string') {
        return NextResponse.json({ error: 'Invalid currentProfileId' }, { status: 400 });
      }

      const profileRow = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(and(eq(profiles.id, currentProfileId), eq(profiles.userId, userId)))
        .limit(1);

      if (profileRow.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
    }

    const existing = await db
      .select({ userId: userSettings.userId })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userSettings).values({ userId, currentProfileId: currentProfileId ?? null });
    } else {
      await db
        .update(userSettings)
        .set({ currentProfileId: currentProfileId ?? null, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
