import './globals.css';
import { cookies } from 'next/headers';
import { verifyAdminToken, COOKIES } from '@/lib/auth';
import { readLocaleFromCookies, makeT, BRAND, getDict } from '@/lib/i18n';
import LogoutLink from './_components/LogoutLink';
import { ToastProvider } from './_components/Toast';
import { LangProvider } from './_components/LangProvider';
import LangSwitch from './_components/LangSwitch';

export function generateMetadata() {
  const locale = readLocaleFromCookies(cookies());
  const dict = getDict(locale);
  return {
    title: BRAND,
    description: dict['site.meta.description'],
  };
}

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get(COOKIES.SESSION_COOKIE)?.value;
  const admin = verifyAdminToken(adminToken);
  const locale = readLocaleFromCookies(cookieStore);
  const t = makeT(locale);

  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'}>
      <body>
        <LangProvider locale={locale}>
          <ToastProvider>
            <div className="header">
              <h1>
                <a href="/">
                  {BRAND}
                  {locale === 'zh' && (
                    <span style={{
                      marginLeft: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      letterSpacing: 0,
                    }}>
                      {t('site.tagline')}
                    </span>
                  )}
                </a>
              </h1>
              <div className="nav">
                <a href="/">{t('nav.home')}</a>
                {admin ? (
                  <>
                    <a href="/admin">{t('nav.admin')}</a>
                    <LogoutLink />
                  </>
                ) : (
                  <a href="/admin/login">{t('nav.adminLogin')}</a>
                )}
                <LangSwitch />
              </div>
            </div>
            <div className="container">{children}</div>
          </ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
