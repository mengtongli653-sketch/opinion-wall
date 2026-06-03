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
    <div className="panel">
      <div className="panel-header">
        <h2>{t('submissions.title')}</h2>
        {items.length > 0 ? (
          <span className="chip-status warn">{items.length} {t('submissions.count')}</span>
        ) : (
          <span className="count">{t('submissions.empty')}</span>
        )}
      </div>
      <div className="panel-body flush">
        {items.map((p) => {
          const busy = busyId === p.id;
          const sectionLabel = p.section_name || null;
          const isNamed = !!p.display_name;
          return (
            <div key={p.id} className="list-item">
              <div className="list-item-meta">
                <span className="chip-status warn">{t('post.badge.pending')}</span>
                {sectionLabel && <span className="chip-status info">{sectionLabel}</span>}
                <span>
                  {isNamed ? (
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{p.display_name}</span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{p.author_tag}</span>
                  )}
                </span>
                {isNamed && (
                  <span className="dim" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
                    {p.author_tag}
                  </span>
                )}
              </div>
              <div className="list-item-title">{p.title}</div>
              <div className="list-item-body">
                {p.content.length > 240 ? p.content.slice(0, 240) + '…' : p.content}
              </div>
              <div className="list-item-actions">
                <button className="small" disabled={busy} onClick={() => publish(p.id)}>
                  {t('submissions.btnPublish')}
                </button>
                <button className="small danger secondary" disabled={busy} onClick={() => reject(p.id)}>
                  {t('submissions.btnReject')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
