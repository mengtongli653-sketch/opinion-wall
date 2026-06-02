import { NextResponse } from 'next/server';
import { publishPost } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  if (!isAdmin()) {
    return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  }
  const id = Number(params.id);
  const updated = publishPost(id);
  if (!updated) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, post: updated });
}
