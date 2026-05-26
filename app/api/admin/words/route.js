import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getBlockedWords, addBlockedWord, removeBlockedWord } from '@/lib/filter';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  return NextResponse.json({ words: getBlockedWords() });
}

export async function POST(request) {
  if (!isAdmin()) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const word = String(body.word || '').trim();
  if (!word) return NextResponse.json({ error: '请输入屏蔽词' }, { status: 400 });
  const created = addBlockedWord(word);
  if (!created) return NextResponse.json({ error: '该词已存在' }, { status: 400 });
  return NextResponse.json({ ok: true, word: created });
}

export async function DELETE(request) {
  if (!isAdmin()) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  removeBlockedWord(id);
  return NextResponse.json({ ok: true });
}
