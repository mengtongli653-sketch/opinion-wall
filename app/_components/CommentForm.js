'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';

const MAX = 1000;

export default function CommentForm({ postId }) {
  const router = useRouter();
  const t = useT();
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || t('comment.fail'));
      return;
    }
    setContent('');
    router.refresh();
  }

  const over = content.length > MAX;

  return (
    <form className="card" onSubmit={submit}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('comment.formTitle')}</div>
      <textarea
        placeholder={t('comment.placeholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX + 50}
        rows={3}
      />
      <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <span className={`counter ${over ? 'over' : ''}`}>{content.length}/{MAX}</span>
        <button type="submit" disabled={busy || !content.trim() || over}>
          {busy ? t('comment.submitting') : t('comment.submit')}
        </button>
      </div>
      {err && <div className="error">{err}</div>}
    </form>
  );
}
