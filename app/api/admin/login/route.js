import { NextResponse } from 'next/server';
import { setAdminCookie, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}
