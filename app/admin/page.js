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

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export default function AdminHome() {
  if (!isAdmin()) redirect('/admin/login');

  const locale = readLocaleFromCookies(cookies());
  const t = makeT(locale);
  const posts = recentPosts(50);
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
      <div className="dashboard-header">
        <div>
          <h1>{t('admin.title')}</h1>
          <div className="sub">{t('admin.welcome')}</div>
        </div>
        <ExportButton />
      </div>

      <div className="stat-grid">
        <StatCard label={t('admin.stat.pendingSubmissions')} value={stats.pendingSubmissions} accent={stats.pendingSubmissions > 0} />
        <StatCard label={t('admin.stat.pendingReports')} value={stats.pendingReports} accent={stats.pendingReports > 0} />
        <StatCard label={t('admin.stat.posts')} value={stats.posts} />
        <StatCard label={t('admin.stat.comments')} value={stats.comments} />
      </div>

      <SubmissionsPanel initial={pending} />

      <ReportsPanel initial={reports} />

      <BlockedWordsManager initial={words} />

      <div className="panel">
        <div className="panel-header">
          <h2>{t('admin.section.recent')}</h2>
          <span className="count">{posts.length}</span>
        </div>
        <div className="panel-body flush">
          {posts.length === 0 && (
            <div className="muted" style={{ padding: '14px 18px' }}>
              {t('admin.recent.empty')}
            </div>
          )}
          {posts.map((p) => (
            <div key={p.id} className="list-item">
              <div className="list-item-meta">
                {p.kind === 'discussion' && (
                  <span className="chip-status muted">{t('forum.kind.badge')}</span>
                )}
                {p.status === 'pending' && (
                  <span className="chip-status warn">{t('post.badge.pending')}</span>
                )}
                {p.pinned ? <span className="chip-status warn">{t('post.badge.pinned')}</span> : null}
                {p.featured ? <span className="chip-status info">{t('post.badge.featured')}</span> : null}
                {p.visibility === 'hidden' && (
                  <span className="chip-status danger">{t('admin.menu.visHidden')}</span>
                )}
                {p.visibility === 'shown' && (
                  <span className="chip-status info">{t('admin.menu.visShown')}</span>
                )}
                <span>
                  {p.display_name ? (
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{p.display_name}</span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{p.author_tag}</span>
                  )}
                </span>
                <span className="sep" style={{ color: 'var(--text-dim)' }}>·</span>
                <span title={formatFull(p.created_at)}>{formatRelative(p.created_at, t)}</span>
              </div>
              <div className="list-item-title">
                <a href={`/post/${p.id}`}>{p.title}</a>
              </div>
              <div className="list-item-body">
                {p.content.length > 140 ? p.content.slice(0, 140) + '…' : p.content}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {t('like.do')} {p.likes || 0} · {t('report.short')} {p.reports || 0}
              </div>
              <div className="list-item-actions">
                <AdminPostControls
                  variant="row"
                  post={{ id: p.id, pinned: !!p.pinned, featured: !!p.featured, visibility: p.visibility }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
