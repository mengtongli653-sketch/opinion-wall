import { NextResponse } from 'next/server';
import { getPost, createComment } from '@/lib/db';
import { getOrCreateAnonId } from '@/lib/auth';
import { containsBlockedWord } from '@/lib/filter';

export const dynamic = 'force-dynamic';

const MAX_DISPLAY_NAME = 30;

function normalizeDisplayName(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  return v.slice(0, MAX_DISPLAY_NAME);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const postId = Number(body.post_id);
  const content = String(body.content || '').trim();
  const display_name = normalizeDisplayName(body.display_name);

  if (!postId || !content) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: '评论不超过 1000 字' }, { status: 400 });
  }

  const post = getPost(postId);
  if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 });

  const hit = containsBlockedWord([content, display_name || ''].join('\n'));
  if (hit) {
    return NextResponse.json({ error: `内容包含屏蔽词：${hit}` }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const anonId = getOrCreateAnonId(response);
  const c = createComment({
    post_id: postId,
    content,
    author_tag: `匿名#${anonId}`,
    display_name,
  });

  return NextResponse.json({ ok: true, id: c.id }, { headers: response.headers });
}
