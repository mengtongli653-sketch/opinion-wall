'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';
import TagPicker from './TagPicker';

const MAX_TITLE = 100;
const MAX_CONTENT = 5000;

export default function NewPostForm({ defaultOpen = false }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (open && titleRef.current) titleRef.current.focus();
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tag }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || t('compose.fail'));
      return;
    }
    setTitle('');
    setContent('');
    setTag(null);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="composer-trigger"
        onClick={() => setOpen(true)}
        aria-label={t('compose.title')}
      >
        <span className="avatar">✍️</span>
        <span>{t('compose.trigger')}</span>
      </button>
    );
  }

  const titleOver = title.length > MAX_TITLE;
  const contentOver = content.length > MAX_CONTENT;

  return (
    <form className="card" onSubmit={submit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 600 }}>{t('compose.title')}</div>
        <button
          type="button"
          className="ghost small"
          onClick={() => { setOpen(false); setErr(''); }}
        >
          {t('compose.collapse')}
        </button>
      </div>
      <input
        ref={titleRef}
        type="text"
        placeholder={t('compose.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_TITLE + 20}
      />
      <div style={{ height: 10 }} />
      <textarea
        placeholder={t('compose.contentPlaceholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_CONTENT + 100}
        rows={5}
      />
      <div style={{ height: 12 }} />
      <TagPicker value={tag} onChange={setTag} />
      <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <span className={`counter ${contentOver ? 'over' : ''}`}>
          {content.length}/{MAX_CONTENT}
        </span>
        <button type="submit" disabled={busy || !title.trim() || !content.trim() || titleOver || contentOver}>
          {busy ? t('compose.submitting') : t('compose.submit')}
        </button>
      </div>
      {err && <div className="error">{err}</div>}
    </form>
  );
}
