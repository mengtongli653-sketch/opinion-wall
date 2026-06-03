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
    title: dict['site.title'] || BRAND,
    description: dict['site.meta.description'],
  };
}

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get(COOKIES.SESSION_COOKIE)?.value;
  const admin = verifyAdminToken(adminToken);
  const locale = readLocaleFromCookies(cookieStore);
  const t = makeT(locale);
  const brand = t('site.brand');

  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'}>
      <body>
        <LangProvider locale={locale}>
          <ToastProvider>
            <header className="app-header" role="banner">
              <div className="app-header-inner">
                <a href="/" className="app-brand">{brand}</a>
                <nav className="app-nav" aria-label="primary">
                  <a href="/">{t('nav.home')}</a>
                  <a href="/forum">{t('nav.forum')}</a>
                  {admin ? (
                    <>
                      <a href="/admin">{t('nav.admin')}</a>
                      <LogoutLink />
                    </>
                  ) : (
                    <a href="/admin/login">{t('nav.adminLogin')}</a>
                  )}
                  <LangSwitch />
                </nav>
              </div>
            </header>

            <main className="container">{children}</main>
          </ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
