import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPost, getSection } from '@/lib/db';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';
import PrintTrigger, { PrintAgainButton } from '@/app/_components/PrintTrigger';

export const dynamic = 'force-dynamic';

function formatPrintDate(locale, ts) {
  const d = new Date(ts);
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return locale === 'zh'
    ? d.toLocaleDateString('zh-CN', opts)
    : d.toLocaleDateString('en-US', opts);
}

export default function PrintPostPage({ params }) {
  const id = Number(params.id);
  const post = getPost(id);
  if (!post) notFound();
  const locale = readLocaleFromCookies(cookies());
  const t = makeT(locale);
  const brand = t('site.brand');
  const section = post.tag ? getSection(post.tag) : null;
  const sectionLabel = section ? section.name : null;
  const date = formatPrintDate(locale, post.created_at);
  const isNamed = !!post.display_name;
  const byline = post.display_name || post.author_tag;

  return (
    <>
      <PrintTrigger />

      <div className="print-toolbar no-print">
        <span style={{ fontWeight: 700 }}>{t('print.preparing')}</span>
        <span className="muted" style={{ flex: 1, fontSize: 12 }}>{t('print.note')}</span>
        <PrintAgainButton label={t('print.reprint')} />
        <a href={`/post/${id}`} className="back-link" style={{ margin: 0 }}>
          ← {t('print.close')}
        </a>
      </div>

      <article className="print-page">
        <header className="print-masthead">
          <div className="print-brand">{brand}</div>
          <div className="print-date">{date}</div>
        </header>

        <hr className="print-rule" />

        {sectionLabel && <div className="print-section">{sectionLabel}</div>}

        <h1 className="print-title">{post.title}</h1>

        <div className="print-byline">
          {t('post.byline.prefix')} <span className={isNamed ? 'named' : 'anon'}>{byline}</span>
          {isNamed && <span className="aux"> · {post.author_tag}</span>}
        </div>

        <div className="print-body">{post.content}</div>

        <hr className="print-rule" style={{ marginTop: 36 }} />
        <div className="print-source">
          {t('print.source')} {brand} · {date}
        </div>
      </article>
    </>
  );
}
