'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from './LangProvider';

const CATEGORIES = [
  { id: 'spam',    i18nKey: 'report.cat.spam' },
  { id: 'attack',  i18nKey: 'report.cat.attack' },
  { id: 'illegal', i18nKey: 'report.cat.illegal' },
  { id: 'misinfo', i18nKey: 'report.cat.misinfo' },
  { id: 'nsfw',    i18nKey: 'report.cat.nsfw' },
  { id: 'other',   i18nKey: 'report.cat.other' },
];

const MAX_REASON = 200;

export default function ReportDialog({ open, onClose, onSubmit, busy = false }) {
  const t = useT();
  const [category, setCategory] = useState('spam');
  const [reason, setReason] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCategory('spam');
      setReason('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reasonTrim = reason.trim();
  const over = reasonTrim.length > MAX_REASON;
  const canSubmit = reasonTrim.length > 0 && !over && !busy;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ category, reason: reasonTrim });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        ref={dialogRef}
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="modal-header">
          <div className="modal-title">{t('report.title')}</div>
          <button type="button" className="ghost icon" onClick={onClose} aria-label={t('common.close')}>×</button>
        </div>

        <div className="modal-body">
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{t('report.subtitle')}</div>

          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6 }}>{t('report.categoryLabel')}</div>
          <div className="chip-row" style={{ marginBottom: 12 }}>
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {t(c.i18nKey)}
              </button>
            ))}
          </div>

          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6 }}>
            {t('report.reasonLabel')} <span className="muted">·</span> <span className="muted" style={{ fontSize: 12 }}>{t('report.required')}</span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('report.reasonPlaceholder')}
            rows={3}
            maxLength={MAX_REASON + 20}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span className={`counter ${over ? 'over' : ''}`}>{reasonTrim.length}/{MAX_REASON}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="danger" disabled={!canSubmit}>
            {busy ? t('report.submitting') : t('report.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
