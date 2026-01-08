import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { verifyAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { profiles, userSettings } from '@/server/db/schema';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await migrationsReady;
  const { id } = await ctx.params;
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
    const [row] = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await migrationsReady;
  const { id } = await ctx.params;
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

    const [row] = await db
      .update(profiles)
      .set({
        name: name ?? undefined,
        data: data ?? undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
      .returning({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      });

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (setCurrent) {
      await upsertCurrentProfile(userId, row.id);
    }

    return NextResponse.json(row);
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await migrationsReady;
  const { id } = await ctx.params;
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
    const deleted = await db
      .delete(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
      .returning({ id: profiles.id });

    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Clear current profile if it was deleted
    await db
      .update(userSettings)
      .set({ currentProfileId: null, updatedAt: new Date() })
      .where(and(eq(userSettings.userId, userId), eq(userSettings.currentProfileId, id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting profile:', err);
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

