import { NextResponse } from 'next/server';
import { deleteComment, updateComment } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(_req, { params }) {
  if (!isAdmin()) return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  const id = Number(params.id);
  deleteComment(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req, { params }) {
  if (!isAdmin()) return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const updated = updateComment(id, body);
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
