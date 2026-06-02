'use client';

import { useState } from 'react';
import { useT } from './LangProvider';
import { useToast } from './Toast';

export default function ExportButton() {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function exportXlsx() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) throw new Error('failed');
      const blob = await res.blob();
      // Pull filename from Content-Disposition if present
      const disp = res.headers.get('Content-Disposition') || '';
      const m = /filename="?([^"]+)"?/.exec(disp);
      const filename = (m && m[1]) || 'opinion-wall-export.xlsx';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(t('export.toastOk'));
    } catch (e) {
      toast(t('export.toastFail'), { kind: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="secondary small" onClick={exportXlsx} disabled={busy}>
      {busy ? t('export.busy') : t('export.button')}
    </button>
  );
}
