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

  const leadPost = posts[0] || null;
  const restPosts = posts.slice(1);

  const renderArticle = (p, { lead = false } = {}) => {
    const visibility = effectiveVisibility(p, { forAdmin: admin });
    const tag = p.tag ? getTag(p.tag) : null;
    const liked = likedSet.has(p.id);
    const reported = reportedSet.has(p.id);
    return (
      <ArticleCard
        key={p.id}
        t={t}
        post={p}
        tag={tag}
        admin={admin}
        liked={liked}
        reported={reported}
        visibility={visibility}
        lead={lead}
      />
    );
  };

  return (
    <>
      <NewPostForm />
      <TagFilter active={activeTag} />

      {posts.length === 0 && (
        <div className="card">
          <div className="empty">
            <span className="emoji">📰</span>
            <div className="title">{t('home.empty.title')}</div>
            <div className="sub">{t('home.empty.sub')}</div>
          </div>
        </div>
      )}

      {leadPost && (
        <>
          <div className="index-heading">{t('home.section.lead')}</div>
          {renderArticle(leadPost, { lead: true })}
        </>
      )}

      {restPosts.length > 0 && (
        <>
          <div className="index-heading">{t('home.section.latest')}</div>
          {restPosts.map((p) => renderArticle(p))}
        </>
      )}
    </>
  );
}

function ArticleCard({ t, post, tag, admin, liked, reported, visibility, lead }) {
  const classes = ['card', 'article'];
  if (lead) classes.push('lead');
  if (post.pinned) classes.push('pinned');
  if (post.featured) classes.push('featured');

  return (
    <article className={classes.join(' ')}>
      {(post.pinned || post.featured) && (
        <div className="badges">
          {post.pinned ? <span className="badge pin">{t('post.badge.pinned')}</span> : null}
          {post.featured ? <span className="badge feat">{t('post.badge.featured')}</span> : null}
        </div>
      )}

      {visibility === 'hidden' ? (
        <HiddenContent>
          <ArticleBody t={t} post={post} tag={tag} liked={liked} reported={reported} />
        </HiddenContent>
      ) : (
        <ArticleBody t={t} post={post} tag={tag} liked={liked} reported={reported} />
      )}

      {admin && (
        <div className="card-menu">
          <AdminPostControls
            post={{ id: post.id, pinned: !!post.pinned, featured: !!post.featured, visibility: post.visibility }}
          />
        </div>
      )}
    </article>
  );
}

function ArticleBody({ t, post, tag, liked, reported }) {
  return (
    <>
      {tag && (
        <div className="section-label">
          <a href={`/?tag=${tag.id}`}>{t(tag.i18nKey)}</a>
        </div>
      )}

      <h3 className="article-title">
        <a href={`/post/${post.id}`}>{post.title}</a>
      </h3>

      <div className="article-excerpt">
        {post.content.length > 220 ? post.content.slice(0, 220) + '…' : post.content}
      </div>

      <div className="byline">
        <span className="by">
          {t('post.byline.prefix')} <span className="author">{post.author_tag}</span>
        </span>
        <span className="sep">·</span>
        <span title={formatFull(post.created_at)}>{formatRelative(post.created_at, t)}</span>
        <span className="sep">·</span>
        <a href={`/post/${post.id}#comments`}>
          {t('post.comments.label')} {post.comment_count}
        </a>
      </div>

      <div style={{ marginTop: 14 }}>
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
