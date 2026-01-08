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

  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.name,
      password: users.password,
    })
    .from(users)
    .where(or(eq(users.email, username), eq(users.name, username)))
    .limit(1);

  const user = userResult[0];

  if (!user || !user.password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signAuthToken({
    id: user.id,
    email: user.email,
    username: user.username ?? username,
  });

  const res = NextResponse.json(
    {
      id: user.id,
      email: user.email,
      username: user.username ?? username,
    },
    { status: 200 },
  );

  res.cookies.set({ ...authCookieOptions(), value: token });

  return res;
}

