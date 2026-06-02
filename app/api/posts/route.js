import { NextResponse } from 'next/server';
import { listPosts, createPost, getOrCreateSection } from '@/lib/db';
import { getOrCreateAnonId, isAdmin } from '@/lib/auth';
import { containsBlockedWord } from '@/lib/filter';

export const dynamic = 'force-dynamic';

const MAX_DISPLAY_NAME = 30;
const MAX_SECTION_NAME = 20;

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
  const tagName = String(body.tag_name || '').trim().replace(/\s+/g, ' ').slice(0, MAX_SECTION_NAME);
  const display_name = normalizeDisplayName(body.display_name);
  const kind = body.kind === 'discussion' ? 'discussion' : 'article';

  if (!title || !content) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: '标题不超过 100 字' }, { status: 400 });
  }
  if (content.length > 5000) {
    return NextResponse.json({ error: '内容不超过 5000 字' }, { status: 400 });
  }

  // Block-word filter covers headline + body + display name + new section
  // name so users can't sneak through by stashing slurs in a section title.
  const hit = containsBlockedWord([title, content, display_name || '', tagName].join('\n'));
  if (hit) {
    return NextResponse.json({ error: `内容包含屏蔽词：${hit}` }, { status: 400 });
  }

  // Find-or-create the section by name (case-insensitive). Discussions
  // ignore sections entirely.
  const section = kind === 'article' && tagName ? getOrCreateSection(tagName) : null;

  const response = NextResponse.json({ ok: true });
  const anonId = getOrCreateAnonId(response);
  const status = kind === 'discussion' || isAdmin() ? 'published' : 'pending';
  const post = createPost({
    title,
    content,
    author_tag: `匿名#${anonId}`,
    display_name,
    tag: section?.id || null,
    kind,
    status,
  });

  return NextResponse.json(
    { ok: true, id: post.id, kind: post.kind, status: post.status, section: section || null },
    { headers: response.headers }
  );
}
