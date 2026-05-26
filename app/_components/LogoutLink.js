'use client';

import { useT } from './LangProvider';

export default function LogoutLink() {
  const t = useT();
  return (
    <a
      href="#"
      onClick={async (e) => {
        e.preventDefault();
        await fetch('/api/admin/logout', { method: 'POST' });
        location.href = '/';
      }}
    >
      {t('nav.logout')}
    </a>
  );
}
