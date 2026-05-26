'use client';

import { useRouter } from 'next/navigation';
import { useT, useLocale, setLocaleCookie } from './LangProvider';

export default function LangSwitch() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

  function toggle() {
    const next = locale === 'zh' ? 'en' : 'zh';
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      className="ghost small"
      onClick={toggle}
      aria-label="Switch language"
      title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      🌐 {t('nav.lang')}
    </button>
  );
}
