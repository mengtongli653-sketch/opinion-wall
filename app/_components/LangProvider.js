'use client';

import { createContext, useContext, useMemo } from 'react';
import { getDict, LOCALE_COOKIE } from '@/lib/i18n';

const LangCtx = createContext({ locale: 'zh', t: (k) => k });

export function LangProvider({ locale, children }) {
  const value = useMemo(() => {
    const dict = getDict(locale);
    return {
      locale,
      t: (key) => dict[key] ?? key,
    };
  }, [locale]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useT() {
  return useContext(LangCtx).t;
}

export function useLocale() {
  return useContext(LangCtx).locale;
}

export function setLocaleCookie(locale) {
  // 1 year, root path
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
