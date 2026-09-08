import { NextResponse } from 'next/server';
import { toggleLike, getComment, getPost } from '@/lib/db';
import { getOrCreateAnonId, isAdmin } from '@/lib/auth';
import { canReadPost } from '@/lib/post-access.mjs';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  const id = Number((await params).id);
  const comment = await getComment(id);
  if (!comment) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const post = await getPost(comment.post_id);
  const forAdmin = await isAdmin();
  if (!canReadPost(post, { forAdmin })) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const carrier = NextResponse.json({ ok: true });
  const anonId = await getOrCreateAnonId(carrier);
  const result = await toggleLike(anonId, 'comment', id, { forAdmin });
  if (!result) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, ...result }, { headers: carrier.headers });
}
