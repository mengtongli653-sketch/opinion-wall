import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPost, listComments, likedIds, reportedIds } from '@/lib/db';
import { verifyAdminToken, COOKIES } from '@/lib/auth';
import { formatFull, formatRelative } from '@/lib/time';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';
import { getTag } from '@/lib/tags';
import { effectiveVisibility } from '@/lib/moderation';
import CommentForm from '@/app/_components/CommentForm';
import AdminPostControls from '@/app/_components/AdminPostControls';
import AdminCommentDelete from '@/app/_components/AdminCommentDelete';
import LikeReportBar from '@/app/_components/LikeReportBar';
import HiddenContent from '@/app/_components/HiddenContent';

export const dynamic = 'force-dynamic';

export default function PostPage({ params }) {
  const id = Number(params.id);
  const post = getPost(id);
  if (!post) notFound();
  const comments = listComments(id);
  const cookieStore = cookies();
  const locale = readLocaleFromCookies(cookieStore);
  const t = makeT(locale);
  const admin = verifyAdminToken(cookieStore.get(COOKIES.SESSION_COOKIE)?.value);
  const anonId = cookieStore.get(COOKIES.ANON_COOKIE)?.value || null;

  const postLiked = anonId ? likedIds(anonId, 'post', [id]).has(id) : false;
  const postReported = anonId ? reportedIds(anonId, 'post', [id]).has(id) : false;

  const commentIds = comments.map((c) => c.id);
  const commentLiked = anonId ? likedIds(anonId, 'comment', commentIds) : new Set();
  const commentReported = anonId ? reportedIds(anonId, 'comment', commentIds) : new Set();

  const postVis = effectiveVisibility(post, { forAdmin: admin });
  const tag = post.tag ? getTag(post.tag) : null;

  return (
    <>
      <a href="/" className="back-link">{t('home.back')}</a>

      <article className="article-detail">
        {(post.pinned || post.featured) && (
          <div className="badges">
            {post.pinned ? <span className="badge pin">{t('post.badge.pinned')}</span> : null}
            {post.featured ? <span className="badge feat">{t('post.badge.featured')}</span> : null}
          </div>
        )}

        {postVis === 'hidden' ? (
          <HiddenContent>
            <ArticleDetail t={t} post={post} tag={tag} liked={postLiked} reported={postReported} />
          </HiddenContent>
        ) : (
          <ArticleDetail t={t} post={post} tag={tag} liked={postLiked} reported={postReported} />
        )}

        {admin && (
          <div className="card-menu">
            <AdminPostControls
              post={{ id: post.id, pinned: !!post.pinned, featured: !!post.featured, visibility: post.visibility }}
            />
          </div>
        )}
      </article>

      <section className="letters-section" id="comments">
        <h2 className="letters-heading">{t('comment.heading')}</h2>
        <div className="letters-sub">
          {comments.length > 0
            ? `${comments.length} ${t('comment.heading')}`
            : t('comment.empty')}
        </div>

        {comments.map((c) => {
          const vis = effectiveVisibility(c, { forAdmin: admin });
          const body = (
            <>
              <div className="letter-body">{c.content}</div>
              <div className="letter-sig">
                {t('post.byline.prefix')}
                <span className="author">{c.author_tag}</span>
                <span style={{ margin: '0 6px' }}>·</span>
                <span title={formatFull(c.created_at)}>{formatRelative(c.created_at, t)}</span>
                {admin && <span style={{ marginLeft: 8 }}><AdminCommentDelete id={c.id} /></span>}
              </div>
              <div className="letter-actions">
                <LikeReportBar
                  target="comment"
                  id={c.id}
                  likes={c.likes || 0}
                  reports={c.reports || 0}
                  liked={commentLiked.has(c.id)}
                  reported={commentReported.has(c.id)}
                  compact
                />
              </div>
            </>
          );
          return (
            <div key={c.id} className="letter">
              {vis === 'hidden' ? <HiddenContent>{body}</HiddenContent> : body}
            </div>
          );
        })}
      </section>

      <CommentForm postId={post.id} />
    </>
  );
}

function ArticleDetail({ t, post, tag, liked, reported }) {
  return (
    <>
      {tag && (
        <div className="section-label">
          <a href={`/?tag=${tag.id}`}>{t(tag.i18nKey)}</a>
        </div>
      )}

      <h1 className="article-title">{post.title}</h1>

      <div className="byline">
        <span className="by">
          {t('post.byline.prefix')} <span className="author">{post.author_tag}</span>
        </span>
        <span className="sep">·</span>
        <span title={formatFull(post.created_at)}>{formatRelative(post.created_at, t)}</span>
      </div>

      <div className="article-body">{post.content}</div>

      <div className="article-actions">
        <LikeReportBar
          target="post"
          id={post.id}
          likes={post.likes || 0}
          reports={post.reports || 0}
          liked={liked}
          reported={reported}
        />
      </div>
    </>
  );
}
