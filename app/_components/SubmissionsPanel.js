'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';
import { useToast } from './Toast';

export default function SubmissionsPanel({ initial }) {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const [items, setItems] = useState(initial || []);
  const [busyId, setBusyId] = useState(0);

  async function publish(id) {
    setBusyId(id);
    const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' });
    setBusyId(0);
    if (!res.ok) return toast(t('submissions.toastFail'), { kind: 'danger' });
    setItems((xs) => xs.filter((x) => x.id !== id));
    toast(t('submissions.toastPublished'));
    router.refresh();
  }

  async function reject(id) {
    if (!confirm(t('submissions.confirmReject'))) return;
    setBusyId(id);
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    setBusyId(0);
    if (!res.ok) return toast(t('submissions.toastFail'), { kind: 'danger' });
    setItems((xs) => xs.filter((x) => x.id !== id));
    toast(t('submissions.toastRejected'));
    router.refresh();
  }

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: 18 }}>
          {t('submissions.title')}
        </span>
        {items.length > 0 && (
          <span className="badge" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
            {items.length} {t('submissions.count')}
          </span>
        )}
      </div>
      <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        {t('submissions.sub')}
      </div>

      {items.length === 0 && (
        <div
          className="muted"
          style={{ fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}
        >
          {t('submissions.empty')}
        </div>
      )}

      {items.map((p) => {
        const busy = busyId === p.id;
        // The server-rendered submissions list now carries the resolved
        // section name on the row (p.section_name) so we don't need a
        // client-side lookup against the sections collection.
        const sectionLabel = p.section_name || null;
        const isNamed = !!p.display_name;
        return (
          <div key={p.id} className="submission">
            <div className="submission-meta">
              <span className="badge" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                {t('post.badge.pending')}
              </span>
              {sectionLabel && (
                <span
                  className="badge"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                >
                  {sectionLabel}
                </span>
              )}
            </div>

            <div className="submission-title">{p.title}</div>

            <div className="submission-body">
              {p.content.length > 280 ? p.content.slice(0, 280) + '…' : p.content}
            </div>

            <div className="submission-byline">
              <span>{t('post.byline.prefix')}</span>
              {isNamed ? (
                <>
                  <span className="named">{p.display_name}</span>
                  <span className="dim">· {t('identity.anonymous')} ID: {p.author_tag}</span>
                </>
              ) : (
                <span className="anon">{p.author_tag}</span>
              )}
            </div>

            <div className="row submission-actions">
              <button className="small" disabled={busy} onClick={() => publish(p.id)}>
                ✓ {t('submissions.btnPublish')}
              </button>
              <button className="small danger secondary" disabled={busy} onClick={() => reject(p.id)}>
                ✗ {t('submissions.btnReject')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
