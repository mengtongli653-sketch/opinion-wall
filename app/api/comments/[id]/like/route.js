import { NextResponse } from 'next/server';
import { toggleLike, getComment } from '@/lib/db';
import { getOrCreateAnonId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  const id = Number(params.id);
  if (!getComment(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const carrier = NextResponse.json({ ok: true });
  const anonId = getOrCreateAnonId(carrier);
  const result = toggleLike(anonId, 'comment', id);
  return NextResponse.json({ ok: true, ...result }, { headers: carrier.headers });
}
