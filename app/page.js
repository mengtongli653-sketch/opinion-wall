import { cookies } from 'next/headers';
import { listPosts, likedIds, reportedIds, listSections, activeSectionIds, getSection } from '@/lib/db';
import { verifyAdminToken, COOKIES, getOrCreateAnonId } from '@/lib/auth';
import { formatFull, formatRelative } from '@/lib/time';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';
import { normalizeTag } from '@/lib/tags';
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

  const activeIds = activeSectionIds();
  const visibleSections = listSections().filter((s) => activeIds.has(s.id));

  const admin = verifyAdminToken(cookieStore.get(COOKIES.SESSION_COOKIE)?.value);
  const anonId = cookieStore.get(COOKIES.ANON_COOKIE)?.value || null;
  const ids = posts.map((p) => p.id);
  const likedSet = anonId ? likedIds(anonId, 'post', ids) : new Set();
  const reportedSet = anonId ? reportedIds(anonId, 'post', ids) : new Set();

  return (
    <>
      <NewPostForm />
      <TagFilter active={activeTag} sections={visibleSections} />

      {posts.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="title">{t('home.empty.title')}</div>
            <div className="sub">{t('home.empty.sub')}</div>
          </div>
        </div>
      )}

      {posts.map((p) => {
        const visibility = effectiveVisibility(p, { forAdmin: admin });
        const section = p.tag ? getSection(p.tag) : null;
        const liked = likedSet.has(p.id);
        const reported = reportedSet.has(p.id);
        return (
          <ArticleCard
            key={p.id}
            t={t}
            post={p}
            section={section}
            admin={admin}
            liked={liked}
            reported={reported}
            visibility={visibility}
          />
        );
      })}
    </>
  );
}

function ArticleCard({ t, post, section, admin, liked, reported, visibility }) {
  return (
    <article className="card">
      {visibility === 'hidden' ? (
        <HiddenContent>
          <ArticleBody t={t} post={post} section={section} liked={liked} reported={reported} />
        </HiddenContent>
      ) : (
        <ArticleBody t={t} post={post} section={section} liked={liked} reported={reported} />
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

function ArticleBody({ t, post, section, liked, reported }) {
  return (
    <div className="article-card">
      <div className="article-card-meta">
        {section && (
          <a className="chip-status info" href={`/?tag=${section.id}`}>{section.name}</a>
        )}
        {post.pinned ? <span className="chip-status warn">{t('post.badge.pinned')}</span> : null}
        {post.featured ? <span className="chip-status info">{t('post.badge.featured')}</span> : null}
      </div>

      <h3 className="article-card-title">
        <a href={`/post/${post.id}`}>{post.title}</a>
      </h3>

      <div className="article-card-excerpt">
        {post.content.length > 200 ? post.content.slice(0, 200) + '…' : post.content}
      </div>

      <div className="article-card-footer">
        <div className="byline">
          {post.display_name ? (
            <span className="named">{post.display_name}</span>
          ) : (
            <span className="anon">{post.author_tag}</span>
          )}
          <span className="sep">·</span>
          <span title={formatFull(post.created_at)}>{formatRelative(post.created_at, t)}</span>
          <span className="sep">·</span>
          <a href={`/post/${post.id}#comments`}>
            {t('post.comments.label')} {post.comment_count}
          </a>
        </div>
        <div className="actions">
          <LikeReportBar
            target="post"
            id={post.id}
            likes={post.likes || 0}
            reports={post.reports || 0}
            liked={!!liked}
            reported={!!reported}
          />
        </div>
      </div>
    </div>
  );
}
