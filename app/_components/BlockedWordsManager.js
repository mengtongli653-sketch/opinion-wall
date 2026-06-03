'use client';

import { useState } from 'react';
import { useT } from './LangProvider';

export default function BlockedWordsManager({ initial }) {
  const t = useT();
  const [words, setWords] = useState(initial || []);
  const [w, setW] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setErr('');
    if (!w.trim()) return;
    setBusy(true);
    const res = await fetch('/api/admin/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: w.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || t('admin.words.addFail'));
      return;
    }
    setWords([data.word, ...words]);
    setW('');
  }

  async function remove(id) {
    if (!confirm(t('admin.words.confirmDel'))) return;
    await fetch(`/api/admin/words?id=${id}`, { method: 'DELETE' });
    setWords(words.filter((x) => x.id !== id));
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{t('admin.words.title')}</h2>
        <span className="count">{words.length}</span>
      </div>
      <div className="panel-body">
        <form onSubmit={add} className="row" style={{ gap: 8 }}>
          <input
            type="text"
            placeholder={t('admin.words.placeholder')}
            value={w}
            onChange={(e) => setW(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={busy}>{busy ? t('admin.words.adding') : t('admin.words.add')}</button>
        </form>
        {err && <div className="error">{err}</div>}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {words.length === 0 && <div className="muted">{t('admin.words.empty')}</div>}
          {words.map((x) => (
            <span key={x.id} className="chip-status danger" style={{ padding: '0 4px 0 10px', gap: 4 }}>
              {x.word}
              <button
                onClick={() => remove(x.id)}
                className="ghost"
                style={{
                  background: 'transparent',
                  color: 'var(--danger)',
                  padding: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1,
                  height: 18,
                  width: 18,
                  minWidth: 18,
                  border: 0,
                }}
                title={t('admin.menu.delete')}
              >×</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
