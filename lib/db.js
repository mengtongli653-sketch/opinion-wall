import fs from 'fs';
import path from 'path';
import { normalizeTag } from './tags';

const DB_PATH = path.join(process.cwd(), 'data.json');

const DEFAULT_STATE = {
  meta: { post_seq: 0, comment_seq: 0, word_seq: 0, report_seq: 0 },
  posts: [],
  comments: [],
  blocked_words: [],
  reactions: [],       // [{ anon_id, target_type:'post'|'comment', target_id, kind:'like' }]
  report_records: [],  // [{ id, anon_id, target_type, target_id, reason, category, created_at, resolved }]
};

let _state = null;
let _loaded = false;
let _writeQueue = Promise.resolve();

function load() {
  if (_loaded) return _state;
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      _state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      _state.meta = { ...DEFAULT_STATE.meta, ..._state.meta };
      _state.reactions = _state.reactions || [];
      _state.report_records = _state.report_records || [];
      // Backfill new fields on legacy rows
      for (const p of _state.posts) {
        if (typeof p.likes !== 'number') p.likes = 0;
        if (typeof p.reports !== 'number') p.reports = 0;
        if (typeof p.tag !== 'string' && p.tag !== null) p.tag = p.tag || null;
        if (typeof p.visibility !== 'string') p.visibility = 'auto';
        // Legacy posts predate the submission workflow — treat as published.
        if (typeof p.status !== 'string') p.status = 'published';
        if (typeof p.display_name !== 'string' && p.display_name !== null) p.display_name = null;
      }
      for (const c of _state.comments) {
        if (typeof c.likes !== 'number') c.likes = 0;
        if (typeof c.reports !== 'number') c.reports = 0;
        if (typeof c.visibility !== 'string') c.visibility = 'auto';
        if (typeof c.display_name !== 'string' && c.display_name !== null) c.display_name = null;
      }
    } else {
      _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      persistSync();
    }
  } catch (e) {
    console.error('Failed to load db, starting fresh:', e);
    _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  _loaded = true;
  return _state;
}

function persistSync() {
  fs.writeFileSync(DB_PATH, JSON.stringify(_state, null, 2), 'utf8');
}

function persist() {
  _writeQueue = _writeQueue.then(
    () =>
      new Promise((resolve) => {
        try {
          fs.writeFileSync(DB_PATH, JSON.stringify(_state, null, 2), 'utf8');
        } catch (e) {
          console.error('Failed to persist db:', e);
        }
        resolve();
      })
  );
  return _writeQueue;
}

export function getState() {
  return load();
}

// ---------- posts ----------

// listPosts now filters to status='published' by default so submissions stay
// out of the public front page until the editor approves them. Pass
// `status: 'pending'` for the editor inbox, or `status: 'all'` for admin
// dashboards.
export function listPosts({ tag, status = 'published' } = {}) {
  const s = load();
  let posts = s.posts;
  if (tag) posts = posts.filter((p) => p.tag === tag);
  if (status !== 'all') {
    posts = posts.filter((p) => (p.status || 'published') === status);
  }
  return [...posts]
    .sort((a, b) => (b.pinned - a.pinned) || (b.created_at - a.created_at))
    .map((p) => ({
      ...p,
      comment_count: s.comments.filter((c) => c.post_id === p.id).length,
    }));
}

export function listPendingPosts() {
  return listPosts({ status: 'pending' });
}

export function countPendingPosts() {
  const s = load();
  return s.posts.filter((p) => (p.status || 'published') === 'pending').length;
}

export function getPost(id) {
  const s = load();
  return s.posts.find((p) => p.id === id) || null;
}

// `status` defaults to 'pending' so all reader submissions land in the
// editor inbox. The /api/posts route bumps it to 'published' when the
// caller is an admin.
// `display_name` is optional — when truthy, the byline shows it in place
// of the anonymous tag (the tag is still stored for moderation).
export function createPost({ title, content, author_tag, tag, status = 'pending', display_name = null }) {
  const s = load();
  s.meta.post_seq += 1;
  const post = {
    id: s.meta.post_seq,
    title,
    content,
    author_tag,
    display_name: display_name || null,
    tag: normalizeTag(tag),
    status: status === 'published' ? 'published' : 'pending',
    pinned: 0,
    featured: 0,
    likes: 0,
    reports: 0,
    visibility: 'auto',
    created_at: Date.now(),
  };
  s.posts.push(post);
  persist();
  return post;
}

export function publishPost(id) {
  const s = load();
  const p = s.posts.find((x) => x.id === id);
  if (!p) return null;
  p.status = 'published';
  // Reset created_at so freshly approved articles surface at the top of
  // the front page rather than being buried by their submission time.
  p.created_at = Date.now();
  persist();
  return p;
}

export function updatePost(id, patch) {
  const s = load();
  const p = s.posts.find((x) => x.id === id);
  if (!p) return null;
  if (typeof patch.pinned === 'boolean') p.pinned = patch.pinned ? 1 : 0;
  if (typeof patch.featured === 'boolean') p.featured = patch.featured ? 1 : 0;
  if (patch.visibility && ['auto', 'shown', 'hidden'].includes(patch.visibility)) {
    p.visibility = patch.visibility;
  }
  persist();
  return p;
}

export function deletePost(id) {
  const s = load();
  s.posts = s.posts.filter((p) => p.id !== id);
  s.comments = s.comments.filter((c) => c.post_id !== id);
  s.reactions = s.reactions.filter((r) => !(r.target_type === 'post' && r.target_id === id));
  s.report_records = s.report_records.filter((r) => !(r.target_type === 'post' && r.target_id === id));
  persist();
}

export function countPosts() {
  return load().posts.length;
}

// Recent published posts for the editor's "recently published" list.
// Pending submissions live in their own panel — this avoids double-listing.
export function recentPosts(limit = 50) {
  const s = load();
  return [...s.posts]
    .filter((p) => (p.status || 'published') === 'published')
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
}

// ---------- comments ----------

export function listComments(postId) {
  const s = load();
  return s.comments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => a.created_at - b.created_at);
}

export function getComment(id) {
  const s = load();
  return s.comments.find((c) => c.id === id) || null;
}

export function createComment({ post_id, content, author_tag, display_name = null }) {
  const s = load();
  s.meta.comment_seq += 1;
  const comment = {
    id: s.meta.comment_seq,
    post_id,
    content,
    author_tag,
    display_name: display_name || null,
    likes: 0,
    reports: 0,
    visibility: 'auto',
    created_at: Date.now(),
  };
  s.comments.push(comment);
  persist();
  return comment;
}

export function updateComment(id, patch) {
  const s = load();
  const c = s.comments.find((x) => x.id === id);
  if (!c) return null;
  if (patch.visibility && ['auto', 'shown', 'hidden'].includes(patch.visibility)) {
    c.visibility = patch.visibility;
  }
  persist();
  return c;
}

export function deleteComment(id) {
  const s = load();
  s.comments = s.comments.filter((c) => c.id !== id);
  s.reactions = s.reactions.filter((r) => !(r.target_type === 'comment' && r.target_id === id));
  s.report_records = s.report_records.filter((r) => !(r.target_type === 'comment' && r.target_id === id));
  persist();
}

export function countComments() {
  return load().comments.length;
}

// ---------- reactions (likes) ----------

function getItem(targetType, targetId) {
  const s = load();
  return targetType === 'post'
    ? s.posts.find((p) => p.id === targetId)
    : s.comments.find((c) => c.id === targetId);
}

export function hasLiked(anonId, targetType, targetId) {
  const s = load();
  return s.reactions.some(
    (r) => r.anon_id === anonId && r.target_type === targetType && r.target_id === targetId && r.kind === 'like'
  );
}

// Toggle like. Returns { liked: boolean, likes: number } or null if target missing.
export function toggleLike(anonId, targetType, targetId) {
  const s = load();
  const item = getItem(targetType, targetId);
  if (!item) return null;
  const idx = s.reactions.findIndex(
    (r) => r.anon_id === anonId && r.target_type === targetType && r.target_id === targetId && r.kind === 'like'
  );
  if (idx >= 0) {
    s.reactions.splice(idx, 1);
    item.likes = Math.max(0, (item.likes || 0) - 1);
  } else {
    s.reactions.push({ anon_id: anonId, target_type: targetType, target_id: targetId, kind: 'like', created_at: Date.now() });
    item.likes = (item.likes || 0) + 1;
  }
  persist();
  return { liked: idx < 0, likes: item.likes };
}

// Bulk read: which target IDs (of the given type) has this anon liked?
export function likedIds(anonId, targetType, ids) {
  const s = load();
  const set = new Set(ids);
  const out = new Set();
  for (const r of s.reactions) {
    if (r.kind === 'like' && r.anon_id === anonId && r.target_type === targetType && set.has(r.target_id)) {
      out.add(r.target_id);
    }
  }
  return out;
}

// ---------- reports ----------

export function hasReported(anonId, targetType, targetId) {
  const s = load();
  return s.report_records.some(
    (r) => r.anon_id === anonId && r.target_type === targetType && r.target_id === targetId
  );
}

export function reportedIds(anonId, targetType, ids) {
  const s = load();
  const set = new Set(ids);
  const out = new Set();
  for (const r of s.report_records) {
    if (r.anon_id === anonId && r.target_type === targetType && set.has(r.target_id)) {
      out.add(r.target_id);
    }
  }
  return out;
}

// Create a report (one per anon_id per target). Returns the record or null if dup/target missing.
export function createReport({ anon_id, target_type, target_id, category, reason }) {
  const s = load();
  const item = getItem(target_type, target_id);
  if (!item) return null;
  if (s.report_records.some((r) => r.anon_id === anon_id && r.target_type === target_type && r.target_id === target_id)) {
    return null;
  }
  s.meta.report_seq = (s.meta.report_seq || 0) + 1;
  const rec = {
    id: s.meta.report_seq,
    anon_id,
    target_type,
    target_id,
    category: String(category || 'other'),
    reason: String(reason || '').slice(0, 200),
    created_at: Date.now(),
    resolved: false,
  };
  s.report_records.push(rec);
  item.reports = (item.reports || 0) + 1;
  persist();
  return rec;
}

export function listReports({ resolved = false } = {}) {
  const s = load();
  // Group by target so each row in the admin queue is per-target with all reasons.
  const groups = new Map();
  for (const r of s.report_records) {
    if (resolved !== null && r.resolved !== resolved) continue;
    const key = `${r.target_type}:${r.target_id}`;
    if (!groups.has(key)) groups.set(key, { target_type: r.target_type, target_id: r.target_id, items: [] });
    groups.get(key).items.push(r);
  }
  const out = [];
  for (const g of groups.values()) {
    const item = getItem(g.target_type, g.target_id);
    if (!item) continue;
    let title = '';
    let preview = '';
    let postId = null;
    if (g.target_type === 'post') {
      title = item.title;
      preview = item.content;
      postId = item.id;
    } else {
      preview = item.content;
      postId = item.post_id;
    }
    out.push({
      ...g,
      title,
      preview: preview.length > 140 ? preview.slice(0, 140) + '…' : preview,
      post_id: postId,
      likes: item.likes || 0,
      reports: item.reports || 0,
      visibility: item.visibility || 'auto',
      latest_at: Math.max(...g.items.map((x) => x.created_at)),
    });
  }
  out.sort((a, b) => b.latest_at - a.latest_at);
  return out;
}

export function resolveReports(targetType, targetId) {
  const s = load();
  let n = 0;
  for (const r of s.report_records) {
    if (r.target_type === targetType && r.target_id === targetId && !r.resolved) {
      r.resolved = true;
      n++;
    }
  }
  if (n) persist();
  return n;
}

export function countPendingReports() {
  const s = load();
  return s.report_records.filter((r) => !r.resolved).length;
}

// ---------- blocked words ----------

export function listBlockedWords() {
  const s = load();
  return [...s.blocked_words].sort((a, b) => b.id - a.id);
}

export function addBlockedWord(word) {
  const s = load();
  const w = String(word || '').trim();
  if (!w) return null;
  if (s.blocked_words.some((x) => x.word.toLowerCase() === w.toLowerCase())) return null;
  s.meta.word_seq += 1;
  const item = { id: s.meta.word_seq, word: w };
  s.blocked_words.push(item);
  persist();
  return item;
}

export function removeBlockedWord(id) {
  const s = load();
  s.blocked_words = s.blocked_words.filter((x) => x.id !== id);
  persist();
}
