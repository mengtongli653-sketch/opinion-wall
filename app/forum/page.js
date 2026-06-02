import { cookies } from 'next/headers';
import { listPosts, likedIds, reportedIds } from '@/lib/db';
import { verifyAdminToken, COOKIES } from '@/lib/auth';
import { formatFull, formatRelative } from '@/lib/time';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';
import { effectiveVisibility } from '@/lib/moderation';
import NewPostForm from '../_components/NewPostForm';
import AdminPostControls from '../_components/AdminPostControls';
import LikeReportBar from '../_components/LikeReportBar';
import HiddenContent from '../_components/HiddenContent';

export const dynamic = 'force-dynamic';

export default function Forum() {
  const cookieStore = cookies();
  const locale = readLocaleFromCookies(cookieStore);
  const t = makeT(locale);

  const posts = listPosts({ kind: 'discussion', status: 'published' });

  const admin = verifyAdminToken(cookieStore.get(COOKIES.SESSION_COOKIE)?.value);
  const anonId = cookieStore.get(COOKIES.ANON_COOKIE)?.value || null;
  const ids = posts.map((p) => p.id);
  const likedSet = anonId ? likedIds(anonId, 'post', ids) : new Set();
  const reportedSet = anonId ? reportedIds(anonId, 'post', ids) : new Set();

  return (
    <>
      <div className="forum-heading">
        <div className="forum-heading-row">
          <h2>💬 {t('forum.title')}</h2>
          <span className="muted">{posts.length}</span>
        </div>
        <div className="forum-heading-sub">{t('forum.sub')}</div>
      </div>

      <NewPostForm kind="discussion" />

      {posts.length === 0 && (
        <div className="card">
          <div className="empty">
            <span className="emoji">🌱</span>
            <div className="title">{t('forum.empty')}</div>
          </div>
        </div>
      )}

      {posts.map((p) => {
        const visibility = effectiveVisibility(p, { forAdmin: admin });
        const liked = likedSet.has(p.id);
        const reported = reportedSet.has(p.id);
        return (
          <article key={p.id} className="card discussion">
            {visibility === 'hidden' ? (
              <HiddenContent>
                <DiscussionBody t={t} post={p} liked={liked} reported={reported} />
              </HiddenContent>
            ) : (
              <DiscussionBody t={t} post={p} liked={liked} reported={reported} />
            )}
            {admin && (
              <div className="card-menu">
                <AdminPostControls
                  post={{
                    id: p.id,
                    pinned: !!p.pinned,
                    featured: !!p.featured,
                    visibility: p.visibility,
                  }}
                />
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}

function DiscussionBody({ t, post, liked, reported }) {
  return (
    <>
      <div className="discussion-meta">
        <span className="discussion-badge">{t('forum.kind.badge')}</span>
        <span className="discussion-byline">
          {t('post.byline.prefix')}{' '}
          {post.display_name ? (
            <span className="named">{post.display_name}</span>
          ) : (
            <span className="anon">{post.author_tag}</span>
          )}
        </span>
        <span className="sep">·</span>
        <span className="muted" title={formatFull(post.created_at)}>
          {formatRelative(post.created_at, t)}
        </span>
      </div>

      <h3 className="discussion-title">
        <a href={`/post/${post.id}`}>{post.title}</a>
      </h3>

      <div className="discussion-content">
        {post.content.length > 320 ? post.content.slice(0, 320) + '…' : post.content}
      </div>

      <div className="discussion-actions">
        <a href={`/post/${post.id}#comments`} className="discussion-reply-link">
          {t('post.comments.label')} {post.comment_count}
        </a>
        <LikeReportBar
          target="post"
          id={post.id}
          likes={post.likes || 0}
          reports={post.reports || 0}
          liked={!!liked}
          reported={!!reported}
        />
      </div>
    </>
  );
}
