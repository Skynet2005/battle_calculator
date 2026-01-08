import bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions, signAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { users } from '@/server/db/schema/users';

export async function POST(req: NextRequest) {
  await migrationsReady;
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, username, password } = body as {
    email?: string;
    username?: string;
    password?: string;
  };

  if (!email || !username || !password) {
    return NextResponse.json({ error: 'Email, username and password are required' }, { status: 400 });
  }

  if (typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.name, username)))
    .limit(1);

  if (existingUser.length > 0) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(users)
    .values({
      email,
      name: username,
      password: passwordHash,
      role: 'user',
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.name,
    });

  const token = await signAuthToken({
    id: created.id,
    email: created.email,
    username: created.username ?? username,
  });

  const res = NextResponse.json(
    {
      id: created.id,
      email: created.email,
      username: created.username ?? username,
    },
    { status: 201 },
  );

  res.cookies.set({ ...authCookieOptions(), value: token });

  return res;
}

