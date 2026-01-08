import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { verifyAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { users } from '@/server/db/schema/users';

export async function GET(req: NextRequest) {
  await migrationsReady;
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyAuthToken(token);

    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.name,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

