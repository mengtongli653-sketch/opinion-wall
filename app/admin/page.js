import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getBlockedWords } from '@/lib/filter';
import {
  recentPosts,
  countPosts,
  countComments,
  listReports,
  countPendingReports,
  listPendingPosts,
  countPendingPosts,
  getSection,
} from '@/lib/db';
import { formatFull, formatRelative } from '@/lib/time';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';
import BlockedWordsManager from '@/app/_components/BlockedWordsManager';
import AdminPostControls from '@/app/_components/AdminPostControls';
import ReportsPanel from '@/app/_components/ReportsPanel';
import SubmissionsPanel from '@/app/_components/SubmissionsPanel';
import ExportButton from '@/app/_components/ExportButton';

export const dynamic = 'force-dynamic';

function Stat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, padding: '8px 4px' }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.2,
          color: accent ? 'var(--warn)' : 'var(--text)',
        }}
      >
        {value}
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function AdminHome() {
  if (!isAdmin()) redirect('/admin/login');

  const locale = readLocaleFromCookies(cookies());
  const t = makeT(locale);
  const posts = recentPosts(50);
  // Server-resolve each pending submission's section name so the client
  // panel doesn't have to fetch /api/sections itself.
  const pending = listPendingPosts().map((p) => ({
    ...p,
    section_name: p.tag ? (getSection(p.tag)?.name ?? null) : null,
  }));
  const words = getBlockedWords();
  const reports = listReports({ resolved: false });
  const stats = {
    posts: countPosts(),
    comments: countComments(),
    words: words.length,
    pendingReports: countPendingReports(),
    pendingSubmissions: countPendingPosts(),
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, fontFamily: 'var(--font-serif)' }}>
              {t('admin.title')}
            </div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{t('admin.welcome')}</div>
          </div>
          <ExportButton />
        </div>
        <div className="row" style={{ gap: 0, borderTop: '1px solid var(--border)', marginTop: 6 }}>
          <Stat label={t('admin.stat.pendingSubmissions')} value={stats.pendingSubmissions} accent={stats.pendingSubmissions > 0} />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <Stat label={t('admin.stat.posts')} value={stats.posts} />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <Stat label={t('admin.stat.comments')} value={stats.comments} />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <Stat label={t('admin.stat.words')} value={stats.words} />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <Stat label={t('admin.stat.pendingReports')} value={stats.pendingReports} accent={stats.pendingReports > 0} />
        </div>
      </div>

      <SubmissionsPanel initial={pending} />

      <ReportsPanel initial={reports} />

      <BlockedWordsManager initial={words} />

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font-serif)', fontSize: 16 }}>
          {t('admin.recent.title')}
        </div>
        {posts.length === 0 && <div className="muted">{t('admin.recent.empty')}</div>}
        {posts.map((p) => (
          <div key={p.id} className="comment">
            <div className="post-meta" style={{ marginBottom: 4, marginTop: 0 }}>
              {p.kind === 'discussion' && (
                <span className="badge kind-discussion">{t('forum.kind.badge')}</span>
              )}
              {p.status === 'pending' && (
                <span className="badge" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                  {t('post.badge.pending')}
                </span>
              )}
              <span className="tag">{p.display_name || p.author_tag}</span>
              {p.display_name && (
                <span className="muted" style={{ fontSize: 11 }} title={p.author_tag}>
                  ({p.author_tag})
                </span>
              )}
              <span title={formatFull(p.created_at)}>{formatRelative(p.created_at, t)}</span>
              {p.pinned ? <span className="badge pin">{t('post.badge.pinned')}</span> : null}
              {p.featured ? <span className="badge feat">{t('post.badge.featured')}</span> : null}
              {p.visibility === 'hidden' && (
                <span className="badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                  {t('admin.menu.visHidden')}
                </span>
              )}
              {p.visibility === 'shown' && (
                <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  {t('admin.menu.visShown')}
                </span>
              )}
            </div>
            <div>
              <a href={`/post/${p.id}`} style={{ fontWeight: 600, color: 'var(--text)' }}>{p.title}</a>
            </div>
            <div className="post-content muted" style={{ fontSize: 13, marginTop: 2 }}>
              {p.content.length > 120 ? p.content.slice(0, 120) + '…' : p.content}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {t('like.do')} {p.likes || 0} · {t('report.short')} {p.reports || 0}
            </div>
            <div style={{ marginTop: 8 }}>
              <AdminPostControls
                variant="row"
                post={{ id: p.id, pinned: !!p.pinned, featured: !!p.featured, visibility: p.visibility }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
