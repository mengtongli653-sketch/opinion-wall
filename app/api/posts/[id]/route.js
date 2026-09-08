import { NextResponse } from 'next/server';
import { getPost, updatePost, deletePost, listComments } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { canReadPost } from '@/lib/post-access.mjs';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const id = Number((await params).id);
  const post = await getPost(id);
  if (!canReadPost(post, { forAdmin: await isAdmin() })) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }
  return NextResponse.json({ post, comments: await listComments(id) });
}

export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  const id = Number((await params).id);
  await deletePost(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: '需要编辑权限' }, { status: 403 });
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const updated = await updatePost(id, body);
  if (!updated) return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
