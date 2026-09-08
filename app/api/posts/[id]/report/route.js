import { NextResponse } from 'next/server';
import { createReport, getPost, hasReported } from '@/lib/db';
import { getOrCreateAnonId, isAdmin } from '@/lib/auth';
import { canReadPost } from '@/lib/post-access.mjs';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['spam', 'attack', 'illegal', 'misinfo', 'nsfw', 'other'];

export async function POST(req, { params }) {
  const id = Number((await params).id);
  const post = await getPost(id);
  const forAdmin = await isAdmin();
  if (!canReadPost(post, { forAdmin })) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'other';
  const reason = String(body.reason || '').trim();
  if (!reason) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 });
  }
  if (reason.length > 200) {
    return NextResponse.json({ error: 'reason_too_long' }, { status: 400 });
  }

  const carrier = NextResponse.json({ ok: true });
  const anonId = await getOrCreateAnonId(carrier);
  if (await hasReported(anonId, 'post', id)) {
    return NextResponse.json({ error: 'already_reported' }, { status: 409, headers: carrier.headers });
  }
  const rec = await createReport({ anon_id: anonId, target_type: 'post', target_id: id, category, reason, forAdmin });
  if (!rec) {
    return NextResponse.json({ error: 'not found' }, { status: 404, headers: carrier.headers });
  }
  return NextResponse.json({ ok: true }, { headers: carrier.headers });
}
