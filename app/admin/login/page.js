'use client';

import { useState } from 'react';
import { useT } from '@/app/_components/LangProvider';

export default function AdminLogin() {
  const t = useT();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || t('login.fail'));
      return;
    }
    location.href = '/admin';
  }

  return (
    <form
      className="card"
      onSubmit={submit}
      style={{ maxWidth: 380, margin: '48px auto', padding: 24 }}
    >
      <div style={{ fontWeight: 700, fontSize: 17, textAlign: 'center', marginBottom: 18 }}>
        {t('login.title')}
      </div>
      <input
        type="password"
        placeholder={t('login.placeholder')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <div style={{ height: 12 }} />
      <button
        type="submit"
        disabled={busy || !password}
        style={{ width: '100%' }}
      >
        {busy ? t('login.submitting') : t('login.submit')}
      </button>
      {err && <div className="error">{err}</div>}
      <div className="muted" style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
        {t('login.hint.pre')} <code style={{ background: 'var(--card-hover)', padding: '1px 6px', borderRadius: 4 }}>admin123</code>{t('login.hint.post')}
      </div>
    </form>
  );
}
