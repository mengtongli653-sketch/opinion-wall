import { NextResponse } from 'next/server';
import { listPosts, createPost } from '@/lib/db';
import { getOrCreateAnonId, isAdmin } from '@/lib/auth';
import { containsBlockedWord } from '@/lib/filter';
import { normalizeTag } from '@/lib/tags';

export const dynamic = 'force-dynamic';

const MAX_DISPLAY_NAME = 30;

function normalizeDisplayName(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  return v.slice(0, MAX_DISPLAY_NAME);
}

export async function GET() {
  return NextResponse.json({ posts: listPosts() });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const tag = normalizeTag(body.tag);
  const display_name = normalizeDisplayName(body.display_name);

  if (!title || !content) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: '标题不超过 100 字' }, { status: 400 });
  }
  if (content.length > 5000) {
    return NextResponse.json({ error: '内容不超过 5000 字' }, { status: 400 });
  }

  const hit = containsBlockedWord([title, content, display_name || ''].join('\n'));
  if (hit) {
    return NextResponse.json({ error: `内容包含屏蔽词：${hit}` }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const anonId = getOrCreateAnonId(response);
  // Editors publish directly; reader submissions sit in the editor inbox
  // until approved.
  const status = isAdmin() ? 'published' : 'pending';
  const post = createPost({
    title,
    content,
    author_tag: `匿名#${anonId}`,
    display_name,
    tag,
    status,
  });

  return NextResponse.json(
    { ok: true, id: post.id, status: post.status },
    { headers: response.headers }
  );
}
