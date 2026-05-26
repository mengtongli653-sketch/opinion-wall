'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';
import { useToast } from './Toast';
import ReportDialog from './ReportDialog';

/**
 * Props:
 *   target: 'post' | 'comment'
 *   id: number
 *   likes: number
 *   reports: number
 *   liked: boolean   — has the current anon already liked?
 *   reported: boolean — has the current anon already reported?
 *   compact?: boolean
 */
export default function LikeReportBar({ target, id, likes, reports, liked, reported, compact = false }) {
  const router = useRouter();
  const t = useT();
  const toast = useToast();

  // Optimistic local state
  const [localLikes, setLocalLikes] = useState(likes);
  const [localLiked, setLocalLiked] = useState(liked);
  const [localReports, setLocalReports] = useState(reports);
  const [localReported, setLocalReported] = useState(reported);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function like() {
    if (busy) return;
    setBusy(true);
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikes(localLikes + (wasLiked ? -1 : 1));
    const res = await fetch(`/api/${target}s/${id}/like`, { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      // revert
      setLocalLiked(wasLiked);
      setLocalLikes(localLikes);
      toast(t('common.opFail'), { kind: 'danger' });
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (typeof data.likes === 'number') setLocalLikes(data.likes);
    if (typeof data.liked === 'boolean') setLocalLiked(data.liked);
    router.refresh();
  }

  async function submitReport({ category, reason }) {
    setSubmitting(true);
    const res = await fetch(`/api/${target}s/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, reason }),
    });
    setSubmitting(false);
    if (res.status === 409) {
      setDialogOpen(false);
      setLocalReported(true);
      toast(t('report.toastDup'));
      return;
    }
    if (!res.ok) {
      toast(t('report.toastFail'), { kind: 'danger' });
      return;
    }
    setDialogOpen(false);
    setLocalReported(true);
    setLocalReports(localReports + 1);
    toast(t('report.toastOk'));
    router.refresh();
  }

  const size = compact ? 'small' : '';

  return (
    <div className="lr-bar" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`ghost ${size} lr-btn ${localLiked ? 'liked' : ''}`}
        onClick={like}
        disabled={busy}
        aria-pressed={localLiked}
        title={localLiked ? t('like.cancel') : t('like.do')}
      >
        <span aria-hidden>{localLiked ? '❤️' : '🤍'}</span>
        <span>{localLikes}</span>
      </button>
      <button
        type="button"
        className={`ghost ${size} lr-btn ${localReported ? 'reported' : ''}`}
        onClick={() => !localReported && setDialogOpen(true)}
        disabled={localReported}
        title={localReported ? t('report.alreadyReported') : t('report.title')}
      >
        <span aria-hidden>🚩</span>
        <span>{localReports}</span>
      </button>

      <ReportDialog
        open={dialogOpen}
        busy={submitting}
        onClose={() => !submitting && setDialogOpen(false)}
        onSubmit={submitReport}
      />
    </div>
  );
}
