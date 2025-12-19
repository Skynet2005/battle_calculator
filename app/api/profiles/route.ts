import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { verifyAuthToken } from '@/lib/auth';
import { db, migrationsReady } from '@/lib/db/db';
import { profiles, userSettings } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  await migrationsReady;
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    const payload = await verifyAuthToken(token);
    userId = payload.id;
  } catch (err) {
    console.error('Auth token verification failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const settings = await db
      .select({ currentProfileId: userSettings.currentProfileId })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return NextResponse.json({
      profiles: rows,
      currentProfileId: settings[0]?.currentProfileId ?? null,
    });
  } catch (err) {
    console.error('Error fetching profiles:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await migrationsReady;
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    const payload = await verifyAuthToken(token);
    userId = payload.id;
  } catch (err) {
    console.error('Auth token verification failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const { name, data, setCurrent } = body as { name?: string; data?: unknown; setCurrent?: boolean };
    if (!name || typeof name !== 'string' || !data) {
      return NextResponse.json({ error: 'Name and data are required' }, { status: 400 });
    }

    const [row] = await db
      .insert(profiles)
      .values({ userId, name, data })
      .returning({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      });

    if (setCurrent) {
      await upsertCurrentProfile(userId, row.id);
    }

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('Error creating profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function upsertCurrentProfile(userId: string, profileId: string | null) {
  const existing = await db
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userSettings).values({ userId, currentProfileId: profileId });
  } else {
    await db
      .update(userSettings)
      .set({ currentProfileId: profileId, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  }
}

