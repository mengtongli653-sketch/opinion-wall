'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './Toast';
import { useT } from './LangProvider';

export default function AdminPostControls({ post, variant = 'menu' }) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  async function patch(payload, label) {
    setBusy(true);
    setOpen(false);
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) toast(label);
    else toast(t('admin.toast.opFail'), { kind: 'danger' });
    router.refresh();
  }

  async function del() {
    if (!confirm(t('admin.confirm.delPost'))) return;
    setBusy(true);
    setOpen(false);
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) toast(t('admin.toast.deleted'));
    else toast(t('admin.toast.delFail'), { kind: 'danger' });
    router.refresh();
  }

  const pinLabel = post.pinned ? t('admin.menu.unpin') : t('admin.menu.pin');
  const featLabel = post.featured ? t('admin.menu.unfeature') : t('admin.menu.feature');
  const pinToast = post.pinned ? t('admin.toast.unpinned') : t('admin.toast.pinned');
  const featToast = post.featured ? t('admin.toast.unfeatured') : t('admin.toast.featured');
  const visibility = post.visibility || 'auto';

  if (variant === 'row') {
    return (
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="small secondary" disabled={busy} onClick={() => patch({ pinned: !post.pinned }, pinToast)}>{pinLabel}</button>
        <button className="small secondary" disabled={busy} onClick={() => patch({ featured: !post.featured }, featToast)}>{featLabel}</button>
        <button className="small danger secondary" disabled={busy} onClick={del}>{t('admin.menu.delete')}</button>
      </div>
    );
  }

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="ghost icon"
        aria-label={t('admin.aria.menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
      >
        ⋯
      </button>
      {open && (
        <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={() => patch({ pinned: !post.pinned }, pinToast)}>{pinLabel}</button>
          <button type="button" role="menuitem" onClick={() => patch({ featured: !post.featured }, featToast)}>{featLabel}</button>
          <div className="sep" />
          <div className="menu-section">{t('admin.menu.visibility')}</div>
          <button type="button" role="menuitem" onClick={() => patch({ visibility: 'auto' }, t('admin.toast.visAuto'))}>
            {visibility === 'auto' ? '✓ ' : ''}{t('admin.menu.visAuto')}
          </button>
          <button type="button" role="menuitem" onClick={() => patch({ visibility: 'shown' }, t('admin.toast.visShown'))}>
            {visibility === 'shown' ? '✓ ' : ''}{t('admin.menu.visShown')}
          </button>
          <button type="button" role="menuitem" onClick={() => patch({ visibility: 'hidden' }, t('admin.toast.visHidden'))}>
            {visibility === 'hidden' ? '✓ ' : ''}{t('admin.menu.visHidden')}
          </button>
          <div className="sep" />
          <button type="button" role="menuitem" className="danger" onClick={del}>{t('admin.menu.delete')}</button>
        </div>
      )}
    </div>
  );
}
