'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';
import { useToast } from './Toast';

const CAT_KEY = {
  spam:    'report.cat.spam',
  attack:  'report.cat.attack',
  illegal: 'report.cat.illegal',
  misinfo: 'report.cat.misinfo',
  nsfw:    'report.cat.nsfw',
  other:   'report.cat.other',
};

export default function ReportsPanel({ initial }) {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const [items, setItems] = useState(initial || []);
  const [busyKey, setBusyKey] = useState('');

  async function setVisibility(target_type, target_id, visibility, label) {
    const key = `${target_type}:${target_id}:${visibility}`;
    setBusyKey(key);
    const path = target_type === 'post' ? `/api/posts/${target_id}` : `/api/comments/${target_id}`;
    const res = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility }),
    });
    setBusyKey('');
    if (!res.ok) return toast(t('admin.toast.opFail'), { kind: 'danger' });
    toast(label);
    router.refresh();
  }

  async function resolve(target_type, target_id) {
    const key = `${target_type}:${target_id}:resolve`;
    setBusyKey(key);
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type, target_id }),
    });
    setBusyKey('');
    if (!res.ok) return toast(t('admin.toast.opFail'), { kind: 'danger' });
    setItems(items.filter((x) => !(x.target_type === target_type && x.target_id === target_id)));
    toast(t('reports.toastResolved'));
    router.refresh();
  }

  async function del(target_type, target_id) {
    if (!confirm(target_type === 'post' ? t('admin.confirm.delPost') : t('admin.confirm.delComment'))) return;
    const key = `${target_type}:${target_id}:del`;
    setBusyKey(key);
    const path = target_type === 'post' ? `/api/posts/${target_id}` : `/api/comments/${target_id}`;
    const res = await fetch(path, { method: 'DELETE' });
    setBusyKey('');
    if (!res.ok) return toast(t('admin.toast.delFail'), { kind: 'danger' });
    setItems(items.filter((x) => !(x.target_type === target_type && x.target_id === target_id)));
    toast(t('admin.toast.deleted'));
    router.refresh();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{t('reports.title')}</h2>
        {items.length > 0 ? (
          <span className="count">{items.length}</span>
        ) : (
          <span className="count">{t('reports.empty')}</span>
        )}
      </div>
      <div className="panel-body flush">
        {items.map((r) => {
          const key = `${r.target_type}:${r.target_id}`;
          const busy = busyKey.startsWith(key + ':');
          return (
            <div key={key} className="list-item">
              <div className="list-item-meta">
                <span className="chip-status muted">
                  {r.target_type === 'post' ? t('reports.typePost') : t('reports.typeComment')}
                </span>
                {r.visibility === 'hidden' && (
                  <span className="chip-status danger">{t('admin.menu.visHidden')}</span>
                )}
                {r.visibility === 'shown' && (
                  <span className="chip-status info">{t('admin.menu.visShown')}</span>
                )}
                <span className="muted">
                  {t('like.do')} {r.likes} · {t('report.short')} {r.reports}
                </span>
              </div>
              {r.title && (
                <div className="list-item-title">
                  <a href={`/post/${r.post_id}`}>{r.title}</a>
                </div>
              )}
              <div className="list-item-body">
                {r.target_type === 'comment' && (
                  <a href={`/post/${r.post_id}#comments`} className="muted" style={{ marginRight: 6 }}>
                    → {t('reports.viewInThread')}
                  </a>
                )}
                {r.preview}
              </div>

              <div style={{
                marginTop: 8,
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  {t('reports.reasonsHeading')}
                </div>
                {r.items.map((item) => (
                  <div key={item.id} style={{ fontSize: 13, paddingTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span className="chip-status danger">
                      {t(CAT_KEY[item.category] || 'report.cat.other')}
                    </span>
                    <span style={{ flex: 1 }}>{item.reason}</span>
                  </div>
                ))}
              </div>

              <div className="list-item-actions">
                <button
                  className="small secondary"
                  disabled={busy}
                  onClick={() => setVisibility(r.target_type, r.target_id, 'hidden', t('admin.toast.visHidden'))}
                >{t('reports.btnHide')}</button>
                <button
                  className="small secondary"
                  disabled={busy}
                  onClick={() => setVisibility(r.target_type, r.target_id, 'shown', t('admin.toast.visShown'))}
                >{t('reports.btnShow')}</button>
                <button
                  className="small secondary"
                  disabled={busy}
                  onClick={() => resolve(r.target_type, r.target_id)}
                >{t('reports.btnResolve')}</button>
                <button
                  className="small danger secondary"
                  disabled={busy}
                  onClick={() => del(r.target_type, r.target_id)}
                >{t('reports.btnDelete')}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
