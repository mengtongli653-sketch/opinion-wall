import { NextResponse } from 'next/server';
import { createReport, getComment, hasReported } from '@/lib/db';
import { getOrCreateAnonId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['spam', 'attack', 'illegal', 'misinfo', 'nsfw', 'other'];

export async function POST(req, { params }) {
  const id = Number(params.id);
  if (!getComment(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'other';
  const reason = String(body.reason || '').trim();
  if (!reason) return NextResponse.json({ error: 'reason_required' }, { status: 400 });
  if (reason.length > 200) return NextResponse.json({ error: 'reason_too_long' }, { status: 400 });

  const carrier = NextResponse.json({ ok: true });
  const anonId = getOrCreateAnonId(carrier);
  if (hasReported(anonId, 'comment', id)) {
    return NextResponse.json({ error: 'already_reported' }, { status: 409, headers: carrier.headers });
  }
  const rec = createReport({ anon_id: anonId, target_type: 'comment', target_id: id, category, reason });
  if (!rec) return NextResponse.json({ error: 'failed' }, { status: 500, headers: carrier.headers });
  return NextResponse.json({ ok: true }, { headers: carrier.headers });
}
