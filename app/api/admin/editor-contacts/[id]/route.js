import { NextResponse } from 'next/server';
import { updateEditorContact, deleteEditorContact } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  }
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const updated = await updateEditorContact(id, body);
  if (!updated) {
    return NextResponse.json({ error: '联系人不存在' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, contact: updated });
}

export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  }
  const id = Number((await params).id);
  await deleteEditorContact(id);
  return NextResponse.json({ ok: true });
}
