import { NextResponse } from 'next/server';
import { createEditorContact } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const entry = createEditorContact({
    name: body.name,
    role: body.role,
    contact_label: body.contact_label,
    contact_value: body.contact_value,
  });
  if (!entry) {
    return NextResponse.json({ error: '请填写姓名' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, contact: entry });
}
