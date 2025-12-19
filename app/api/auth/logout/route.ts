import { NextResponse } from 'next/server';

import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(clearAuthCookie());
  return res;
}

