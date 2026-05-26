'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from './Toast';
import { useT } from './LangProvider';

export default function AdminCommentDelete({ id }) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm(t('admin.confirm.delComment'))) return;
    setBusy(true);
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) toast(t('admin.toast.commentDeleted'));
    else toast(t('admin.toast.delFail'), { kind: 'danger' });
    router.refresh();
  }

  return (
    <button className="small danger secondary" disabled={busy} onClick={del} style={{ marginLeft: 'auto' }}>
      {t('admin.menu.delete')}
    </button>
  );
}
