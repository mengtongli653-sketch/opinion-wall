import { NextResponse } from 'next/server';
import { toggleLike, getPost } from '@/lib/db';
import { getOrCreateAnonId, isAdmin } from '@/lib/auth';
import { canReadPost } from '@/lib/post-access.mjs';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  const id = Number((await params).id);
  const post = await getPost(id);
  const forAdmin = await isAdmin();
  if (!canReadPost(post, { forAdmin })) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const carrier = NextResponse.json({ ok: true });
  const anonId = await getOrCreateAnonId(carrier);
  const result = await toggleLike(anonId, 'post', id, { forAdmin });
  if (!result) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, ...result }, { headers: carrier.headers });
}
