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

function formatIssueDate(locale) {
  const now = new Date();
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return locale === 'zh'
    ? now.toLocaleDateString('zh-CN', opts)
    : now.toLocaleDateString('en-US', opts);
}

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get(COOKIES.SESSION_COOKIE)?.value;
  const admin = verifyAdminToken(adminToken);
  const locale = readLocaleFromCookies(cookieStore);
  const t = makeT(locale);

  const brand = t('site.brand');
  const tagline = t('site.tagline');
  const subline = t('site.masthead.subline');
  const dateline = formatIssueDate(locale);

  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'}>
      <body>
        <LangProvider locale={locale}>
          <ToastProvider>
            <header className="masthead" role="banner">
              <h1 className="masthead-brand">
                <a href="/">{brand}</a>
              </h1>
              <div className="masthead-tagline">{tagline}</div>
              <div className="masthead-issue">
                <span>{dateline}</span>
              </div>
              <div className="masthead-subline">{subline}</div>
            </header>

            <nav className="subnav" aria-label="primary">
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
            </nav>

            <div className="container">{children}</div>

            <footer className="colophon">
              <div>
                <span className="name">{brand}</span>
                {brand !== BRAND && <span className="dim"> · {BRAND}</span>}
              </div>
              <div className="dim">{subline}</div>
            </footer>
          </ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
