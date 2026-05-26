import { NextResponse } from 'next/server';
import { getPost, updatePost, deletePost, listComments } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const id = Number(params.id);
  const post = getPost(id);
  if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  return NextResponse.json({ post, comments: listComments(id) });
}

export async function DELETE(_req, { params }) {
  if (!isAdmin()) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  const id = Number(params.id);
  deletePost(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req, { params }) {
  if (!isAdmin()) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const updated = updatePost(id, body);
  if (!updated) return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
