'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';
import { useToast } from './Toast';
import TagPicker from './TagPicker';
import IdentityPicker from './IdentityPicker';

const MAX_TITLE = 100;
const MAX_CONTENT = 5000;

// `kind` switches the form copy + workflow:
//   - 'article'    (default): editor-reviewed submission, includes section picker
//   - 'discussion'          : casual instant-post for the /forum feed
export default function NewPostForm({ defaultOpen = false, kind = 'article' }) {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState(null);
  const [named, setNamed] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);
  const isDiscussion = kind === 'discussion';

  useEffect(() => {
    if (open && titleRef.current) titleRef.current.focus();
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (named && !displayName.trim()) {
      setErr(t('identity.nameRequired'));
      return;
    }
    setBusy(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        // Discussions ignore section tagging — they're a single open feed.
        tag: isDiscussion ? null : tag,
        kind,
        display_name: named ? displayName.trim() : undefined,
      }),
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
    setNamed(false);
    setDisplayName('');
    setOpen(false);
    if (isDiscussion) {
      toast(t('compose.discussion.toastPublished'));
    } else if (data.status === 'pending') {
      toast(t('compose.toastSubmitted'));
    } else {
      toast(t('compose.toastPublished'));
    }
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="composer-trigger"
        onClick={() => setOpen(true)}
        aria-label={t(isDiscussion ? 'compose.discussion.title' : 'compose.title')}
      >
        <span>{t(isDiscussion ? 'compose.discussion.trigger' : 'compose.trigger')}</span>
      </button>
    );
  }

  const titleOver = title.length > MAX_TITLE;
  const contentOver = content.length > MAX_CONTENT;

  return (
    <form className="card" onSubmit={submit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {t(isDiscussion ? 'compose.discussion.title' : 'compose.title')}
        </div>
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
        placeholder={t(isDiscussion ? 'compose.discussion.titlePlaceholder' : 'compose.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_TITLE + 20}
      />
      <div style={{ height: 10 }} />
      <textarea
        placeholder={t(isDiscussion ? 'compose.discussion.contentPlaceholder' : 'compose.contentPlaceholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_CONTENT + 100}
        rows={isDiscussion ? 4 : 6}
      />
      {!isDiscussion && (
        <>
          <div style={{ height: 12 }} />
          <TagPicker value={tag} onChange={setTag} />
        </>
      )}
      <div style={{ height: 14 }} />
      <IdentityPicker
        named={named}
        displayName={displayName}
        onChange={({ named: n, displayName: d }) => { setNamed(n); setDisplayName(d); }}
      />
      <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <span className={`counter ${contentOver ? 'over' : ''}`}>
          {content.length}/{MAX_CONTENT}
        </span>
        <button type="submit" disabled={busy || !title.trim() || !content.trim() || titleOver || contentOver}>
          {busy
            ? t('compose.submitting')
            : t(isDiscussion ? 'compose.discussion.submit' : 'compose.submit')}
        </button>
      </div>
      {err && <div className="error">{err}</div>}
    </form>
  );
}
