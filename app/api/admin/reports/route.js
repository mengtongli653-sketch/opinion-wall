import { NextResponse } from 'next/server';
import { listReports, resolveReports } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ reports: listReports({ resolved: false }) });
}

// Admin resolves all reports for a target.
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const target_type = body.target_type;
  const target_id = Number(body.target_id);
  if (!['post', 'comment'].includes(target_type) || !target_id) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const n = resolveReports(target_type, target_id);
  return NextResponse.json({ ok: true, resolved: n });
}
