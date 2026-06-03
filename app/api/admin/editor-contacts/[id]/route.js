import { NextResponse } from 'next/server';
import { updateEditorContact, deleteEditorContact } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  if (!isAdmin()) {
    return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  }
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const updated = updateEditorContact(id, body);
  if (!updated) {
    return NextResponse.json({ error: '联系人不存在' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, contact: updated });
}

export async function DELETE(_req, { params }) {
  if (!isAdmin()) {
    return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  }
  const id = Number(params.id);
  deleteEditorContact(id);
  return NextResponse.json({ ok: true });
}
