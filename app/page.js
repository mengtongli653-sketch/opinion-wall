import { cookies } from 'next/headers';
import { listPosts, likedIds, reportedIds } from '@/lib/db';
import { verifyAdminToken, COOKIES, getOrCreateAnonId } from '@/lib/auth';
import { formatFull, formatRelative } from '@/lib/time';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';
import { getTag, normalizeTag } from '@/lib/tags';
import { effectiveVisibility } from '@/lib/moderation';
import NewPostForm from './_components/NewPostForm';
import AdminPostControls from './_components/AdminPostControls';
import LikeReportBar from './_components/LikeReportBar';
import HiddenContent from './_components/HiddenContent';
import TagFilter from './_components/TagFilter';

export const dynamic = 'force-dynamic';

export default function Home({ searchParams }) {
  const cookieStore = cookies();
  const locale = readLocaleFromCookies(cookieStore);
  const t = makeT(locale);

  const activeTag = normalizeTag(searchParams?.tag);
  const posts = listPosts({ tag: activeTag });

  const admin = verifyAdminToken(cookieStore.get(COOKIES.SESSION_COOKIE)?.value);
  const anonId = cookieStore.get(COOKIES.ANON_COOKIE)?.value || null;
  const ids = posts.map((p) => p.id);
  const likedSet = anonId ? likedIds(anonId, 'post', ids) : new Set();
  const reportedSet = anonId ? reportedIds(anonId, 'post', ids) : new Set();

  return (
    <>
      <NewPostForm />
      <TagFilter active={activeTag} />
      <div>
        {posts.length === 0 && (
          <div className="card">
            <div className="empty">
              <span className="emoji">💬</span>
              <div className="title">{t('home.empty.title')}</div>
              <div className="sub">{t('home.empty.sub')}</div>
            </div>
          </div>
        )}
        {posts.map((p) => {
          const visibility = effectiveVisibility(p, { forAdmin: admin });
          const tag = p.tag ? getTag(p.tag) : null;
          const liked = likedSet.has(p.id);
          const reported = reportedSet.has(p.id);
          return (
            <article key={p.id} className={`card ${p.pinned ? 'pinned' : ''} ${p.featured ? 'featured' : ''}`}>
              {(p.pinned || p.featured) && (
                <div className="badges">
                  {p.pinned ? <span className="badge pin">{t('post.badge.pinned')}</span> : null}
                  {p.featured ? <span className="badge feat">{t('post.badge.featured')}</span> : null}
                </div>
              )}

              {visibility === 'hidden' ? (
                <HiddenContent>
                  <PostBody t={t} p={p} tag={tag} admin={admin} liked={liked} reported={reported} />
                </HiddenContent>
              ) : (
                <PostBody t={t} p={p} tag={tag} admin={admin} liked={liked} reported={reported} />
              )}

              {admin && (
                <div className="card-menu">
                  <AdminPostControls post={{ id: p.id, pinned: !!p.pinned, featured: !!p.featured, visibility: p.visibility }} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function PostBody({ t, p, tag, admin, liked, reported }) {
  return (
    <>
      <h3 className="post-title">
        <a href={`/post/${p.id}`}>{p.title}</a>
      </h3>
      <div className="post-content dim">
        {p.content.length > 200 ? p.content.slice(0, 200) + '…' : p.content}
      </div>
      <div className="post-meta">
        {tag && (
          <a href={`/?tag=${tag.id}`} className="tag-pill" title={t(tag.i18nKey)}>
            <span aria-hidden>{tag.emoji}</span>
            <span>{t(tag.i18nKey)}</span>
          </a>
        )}
        <span className="tag">{p.author_tag}</span>
        <span title={formatFull(p.created_at)}>{formatRelative(p.created_at, t)}</span>
        <a href={`/post/${p.id}#comments`}>{t('post.comments.label')} {p.comment_count}</a>
      </div>
      <div style={{ marginTop: 10 }}>
        <LikeReportBar
          target="post"
          id={p.id}
          likes={p.likes || 0}
          reports={p.reports || 0}
          liked={!!liked}
          reported={!!reported}
        />
      </div>
    </>
  );
}
