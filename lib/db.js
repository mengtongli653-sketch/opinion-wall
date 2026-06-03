import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.json');

const DEFAULT_STATE = {
  meta: { post_seq: 0, comment_seq: 0, word_seq: 0, report_seq: 0, section_seq: 0, editor_contact_seq: 0 },
  posts: [],
  comments: [],
  blocked_words: [],
  reactions: [],       // [{ anon_id, target_type:'post'|'comment', target_id, kind:'like' }]
  report_records: [],  // [{ id, anon_id, target_type, target_id, reason, category, created_at, resolved }]
  sections: [],        // [{ id, name, created_at }] — user-created on submit
  editor_contacts: [], // [{ id, name, role, contact_label, contact_value, created_at }]
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
      _state.sections = _state.sections || [];
      _state.editor_contacts = _state.editor_contacts || [];
      if (typeof _state.meta.section_seq !== 'number') _state.meta.section_seq = 0;
      if (typeof _state.meta.editor_contact_seq !== 'number') _state.meta.editor_contact_seq = 0;
      // Build set of known section IDs so we can clear orphans.
      const sectionIds = new Set(_state.sections.map((s) => s.id));
      // Backfill new fields on legacy rows
      for (const p of _state.posts) {
        if (typeof p.likes !== 'number') p.likes = 0;
        if (typeof p.reports !== 'number') p.reports = 0;
        if (typeof p.tag !== 'string' && p.tag !== null) p.tag = p.tag || null;
        if (typeof p.visibility !== 'string') p.visibility = 'auto';
        // Legacy posts predate the submission workflow — treat as published.
        if (typeof p.status !== 'string') p.status = 'published';
        if (typeof p.display_name !== 'string' && p.display_name !== null) p.display_name = null;
        // Legacy posts predate the free-discussion split — they're articles.
        if (typeof p.kind !== 'string') p.kind = 'article';
        // Sections are now user-created; orphan legacy tag values like
        // 'chat' / 'help' that no longer map to a section.
        if (p.tag && !sectionIds.has(p.tag)) p.tag = null;
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

// listPosts filters published posts by kind by default. Pass kind:'all' to
// get every kind (useful for editor dashboards); kind:'discussion' for the
// /forum feed. status:'pending' returns the editor inbox; status:'all'
// returns every state.
export function listPosts({ tag, status = 'published', kind = 'article' } = {}) {
  const s = load();
  let posts = s.posts;
  if (tag) posts = posts.filter((p) => p.tag === tag);
  if (kind !== 'all') {
    posts = posts.filter((p) => (p.kind || 'article') === kind);
  }
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

// Editor inbox: only articles can be pending (discussions auto-publish).
export function listPendingPosts() {
  return listPosts({ status: 'pending', kind: 'article' });
}

export function countPendingPosts() {
  const s = load();
  return s.posts.filter(
    (p) => (p.status || 'published') === 'pending' && (p.kind || 'article') === 'article'
  ).length;
}

export function getPost(id) {
  const s = load();
  return s.posts.find((p) => p.id === id) || null;
}

// `status` defaults to 'pending' so reader submissions land in the editor
// inbox. The /api/posts route bumps it to 'published' for admins or for
// the free-discussion track.
// `kind` ('article' | 'discussion') splits formal news from the casual
// forum feed.
// `display_name` is optional — when truthy, the byline shows it in place
// of the anonymous tag (the tag is still stored for moderation).
export function createPost({
  title,
  content,
  author_tag,
  tag,
  status = 'pending',
  kind = 'article',
  display_name = null,
}) {
  const s = load();
  s.meta.post_seq += 1;
  const post = {
    id: s.meta.post_seq,
    title,
    content,
    author_tag,
    display_name: display_name || null,
    // tag is now a dynamic section id (resolved by /api/posts) or null
    tag: tag || null,
    kind: kind === 'discussion' ? 'discussion' : 'article',
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

// ---------- sections (user-created) ----------

const MAX_SECTION_NAME = 20;

function normalizeSectionName(raw) {
  return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, MAX_SECTION_NAME);
}

export function listSections() {
  const s = load();
  return [...s.sections].sort((a, b) => a.created_at - b.created_at);
}

export function getSection(id) {
  if (!id) return null;
  const s = load();
  return s.sections.find((x) => x.id === id) || null;
}

export function findSectionByName(name) {
  const norm = normalizeSectionName(name);
  if (!norm) return null;
  const s = load();
  const lower = norm.toLowerCase();
  return s.sections.find((x) => x.name.toLowerCase() === lower) || null;
}

// Find by name (case-insensitive) or create a new section. Used by the post
// API when a submitter types either an existing or a new section name.
// Returns null for empty input.
export function getOrCreateSection(name) {
  const norm = normalizeSectionName(name);
  if (!norm) return null;
  const s = load();
  const existing = s.sections.find((x) => x.name.toLowerCase() === norm.toLowerCase());
  if (existing) return existing;
  s.meta.section_seq = (s.meta.section_seq || 0) + 1;
  const section = {
    id: `sec${s.meta.section_seq}`,
    name: norm,
    created_at: Date.now(),
  };
  s.sections.push(section);
  persist();
  return section;
}

// Section IDs in use by at least one published article. Used by TagFilter
// so we only render filters that lead somewhere.
export function activeSectionIds() {
  const s = load();
  const ids = new Set();
  for (const p of s.posts) {
    if (p.tag && (p.status || 'published') === 'published' && (p.kind || 'article') === 'article') {
      ids.add(p.tag);
    }
  }
  return ids;
}

// ---------- editor contacts ----------
// Public-facing "Reader Letters" page lists who to write to and how.
// Editors curate these entries through the admin console.

const MAX_CONTACT_FIELD = 80;

function normContactField(raw, max = MAX_CONTACT_FIELD) {
  return String(raw || '').trim().slice(0, max);
}

export function listEditorContacts() {
  const s = load();
  return [...s.editor_contacts].sort((a, b) => a.created_at - b.created_at);
}

export function createEditorContact({ name, role, contact_label, contact_value }) {
  const s = load();
  const n = normContactField(name);
  if (!n) return null;
  s.meta.editor_contact_seq = (s.meta.editor_contact_seq || 0) + 1;
  const entry = {
    id: s.meta.editor_contact_seq,
    name: n,
    role: normContactField(role),
    contact_label: normContactField(contact_label, 30),
    contact_value: normContactField(contact_value, 120),
    created_at: Date.now(),
  };
  s.editor_contacts.push(entry);
  persist();
  return entry;
}

export function updateEditorContact(id, patch) {
  const s = load();
  const e = s.editor_contacts.find((x) => x.id === id);
  if (!e) return null;
  if (patch.name != null)          e.name          = normContactField(patch.name);
  if (patch.role != null)          e.role          = normContactField(patch.role);
  if (patch.contact_label != null) e.contact_label = normContactField(patch.contact_label, 30);
  if (patch.contact_value != null) e.contact_value = normContactField(patch.contact_value, 120);
  persist();
  return e;
}

export function deleteEditorContact(id) {
  const s = load();
  const before = s.editor_contacts.length;
  s.editor_contacts = s.editor_contacts.filter((x) => x.id !== id);
  if (s.editor_contacts.length !== before) persist();
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
