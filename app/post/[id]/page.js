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
      <div style={{ marginBottom: 10 }}>
        <a href="/" className="muted">{t('home.back')}</a>
      </div>

      <article className={`card ${post.pinned ? 'pinned' : ''} ${post.featured ? 'featured' : ''}`}>
        {(post.pinned || post.featured) && (
          <div className="badges">
            {post.pinned ? <span className="badge pin">{t('post.badge.pinned')}</span> : null}
            {post.featured ? <span className="badge feat">{t('post.badge.featured')}</span> : null}
          </div>
        )}
        {postVis === 'hidden' ? (
          <HiddenContent>
            <PostDetail t={t} post={post} tag={tag} liked={postLiked} reported={postReported} />
          </HiddenContent>
        ) : (
          <PostDetail t={t} post={post} tag={tag} liked={postLiked} reported={postReported} />
        )}
        {admin && (
          <div className="card-menu">
            <AdminPostControls post={{ id: post.id, pinned: !!post.pinned, featured: !!post.featured, visibility: post.visibility }} />
          </div>
        )}
      </article>

      <div className="card" id="comments">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('comment.heading')} ({comments.length})</div>
        {comments.length === 0 && (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <span className="emoji">🌱</span>
            <div className="sub">{t('comment.empty')}</div>
          </div>
        )}
        {comments.map((c) => {
          const vis = effectiveVisibility(c, { forAdmin: admin });
          const body = (
            <>
              <div className="post-meta" style={{ marginBottom: 6, marginTop: 0 }}>
                <span className="tag">{c.author_tag}</span>
                <span title={formatFull(c.created_at)}>{formatRelative(c.created_at, t)}</span>
                {admin && <AdminCommentDelete id={c.id} />}
              </div>
              <div className="post-content">{c.content}</div>
              <div style={{ marginTop: 8 }}>
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
            <div key={c.id} className="comment">
              {vis === 'hidden' ? <HiddenContent>{body}</HiddenContent> : body}
            </div>
          );
        })}
      </div>

      <CommentForm postId={post.id} />
    </>
  );
}

function PostDetail({ t, post, tag, liked, reported }) {
  return (
    <>
      <h2 className="post-title" style={{ fontSize: 20 }}>{post.title}</h2>
      <div className="post-meta" style={{ marginTop: 4, marginBottom: 14 }}>
        {tag && (
          <a href={`/?tag=${tag.id}`} className="tag-pill" title={t(tag.i18nKey)}>
            <span aria-hidden>{tag.emoji}</span>
            <span>{t(tag.i18nKey)}</span>
          </a>
        )}
        <span className="tag">{post.author_tag}</span>
        <span title={formatFull(post.created_at)}>{formatRelative(post.created_at, t)}</span>
      </div>
      <div className="post-content">{post.content}</div>
      <div style={{ marginTop: 14 }}>
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
