import { canReadPost } from './post-access.mjs';

// Pure business operations. Each caller receives an isolated state snapshot.
export function emptyState() {
  return {
    meta: { post_seq: 0, comment_seq: 0, word_seq: 0, report_seq: 0, section_seq: 0, editor_contact_seq: 0 },
    posts: [], comments: [], blocked_words: [], reactions: [], report_records: [],
    sections: [], editor_contacts: [],
  };
}

export function normalizeState(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Stored board state is invalid; refusing to replace it.');
  }
  const state = { ...emptyState(), ...structuredClone(input) };
  state.meta = { ...emptyState().meta, ...state.meta };
  for (const key of ['posts', 'comments', 'blocked_words', 'reactions', 'report_records', 'sections', 'editor_contacts']) {
    if (!Array.isArray(state[key])) throw new Error('Stored board collection is invalid: ' + key);
  }
  for (const key of Object.keys(emptyState().meta)) {
    if (!Number.isSafeInteger(state.meta[key]) || state.meta[key] < 0) {
      throw new Error('Stored board sequence is invalid: ' + key);
    }
  }
  const sectionIds = new Set(state.sections.map((section) => section.id));
  for (const post of state.posts) {
    if (typeof post.likes !== 'number') post.likes = 0;
    if (typeof post.reports !== 'number') post.reports = 0;
    if (typeof post.tag !== 'string' && post.tag !== null) post.tag = post.tag || null;
    if (typeof post.visibility !== 'string') post.visibility = 'auto';
    if (typeof post.status !== 'string') post.status = 'published';
    if (typeof post.display_name !== 'string' && post.display_name !== null) post.display_name = null;
    if (typeof post.kind !== 'string') post.kind = 'article';
    if (post.tag && !sectionIds.has(post.tag)) post.tag = null;
  }
  for (const comment of state.comments) {
    if (typeof comment.likes !== 'number') comment.likes = 0;
    if (typeof comment.reports !== 'number') comment.reports = 0;
    if (typeof comment.visibility !== 'string') comment.visibility = 'auto';
    if (typeof comment.display_name !== 'string' && comment.display_name !== null) comment.display_name = null;
  }
  // Keep legacy files with missing/stale counters from reusing existing IDs.
  for (const [sequence, rows] of [
    ['post_seq', state.posts], ['comment_seq', state.comments],
    ['word_seq', state.blocked_words], ['report_seq', state.report_records],
    ['editor_contact_seq', state.editor_contacts],
  ]) {
    state.meta[sequence] = rows.reduce((max, row) => Number.isSafeInteger(row.id) ? Math.max(max, row.id) : max, state.meta[sequence]);
  }
  state.meta.section_seq = state.sections.reduce((max, row) => {
    const match = /^sec(\d+)$/.exec(row.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, state.meta.section_seq);
  return state;
}

export function createStateModel(input) {
  const state = normalizeState(input);
  let dirty = false;
  function load() { return state; }
  function persist() { dirty = true; }

  function getState() {
    return load();
  }

  // ---------- posts ----------

  // listPosts filters published posts by kind by default. Pass kind:'all' to
  // get every kind (useful for editor dashboards); kind:'discussion' for the
  // /forum feed. status:'pending' returns the editor inbox; status:'all'
  // returns every state.
  function listPosts({ tag, status = 'published', kind = 'article', forAdmin = false } = {}) {
    const s = load();
    let posts = s.posts;
    if (!forAdmin) posts = posts.filter((post) => !post.legacy_private);
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
  function listPendingPosts() {
    return listPosts({ status: 'pending', kind: 'article' });
  }

  function countPendingPosts() {
    const s = load();
    return s.posts.filter(
      (p) => (p.status || 'published') === 'pending' && (p.kind || 'article') === 'article'
    ).length;
  }

  function getPost(id) {
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
  function createPost({
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

  function publishPost(id) {
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

  function updatePost(id, patch) {
    const s = load();
    const p = s.posts.find((x) => x.id === id);
    if (!p) return null;
    if (typeof patch.pinned === 'boolean') p.pinned = patch.pinned ? 1 : 0;
    if (typeof patch.featured === 'boolean') p.featured = patch.featured ? 1 : 0;
    if (patch.visibility && ['auto', 'shown', 'hidden'].includes(patch.visibility)) {
      p.visibility = patch.visibility;
      if (patch.visibility === 'shown') p.legacy_private = false;
    }
    persist();
    return p;
  }

  function deletePost(id) {
    const s = load();
    const deleted = s.posts.find((post) => post.id === id);
    if (deleted?.legacy_id) {
      s.meta.legacy_imported_ids = [...new Set([...(s.meta.legacy_imported_ids || []), String(deleted.legacy_id)])];
    }
    s.posts = s.posts.filter((p) => p.id !== id);
    s.comments = s.comments.filter((c) => c.post_id !== id);
    s.reactions = s.reactions.filter((r) => !(r.target_type === 'post' && r.target_id === id));
    s.report_records = s.report_records.filter((r) => !(r.target_type === 'post' && r.target_id === id));
    persist();
  }

  function countPosts() {
    return load().posts.length;
  }

  // Recent published posts for the editor's "recently published" list.
  // Pending submissions live in their own panel — this avoids double-listing.
  function recentPosts(limit = 50) {
    const s = load();
    return [...s.posts]
      .filter((p) => (p.status || 'published') === 'published')
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit);
  }

  // ---------- comments ----------

  function listComments(postId) {
    const s = load();
    return s.comments
      .filter((c) => c.post_id === postId)
      .sort((a, b) => a.created_at - b.created_at);
  }

  function getComment(id) {
    const s = load();
    return s.comments.find((c) => c.id === id) || null;
  }

  function createComment({ post_id, content, author_tag, display_name = null, forAdmin = false }) {
    const s = load();
    const parent = s.posts.find((post) => post.id === post_id);
    if (!canReadPost(parent, { forAdmin })) return null;
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

  function updateComment(id, patch) {
    const s = load();
    const c = s.comments.find((x) => x.id === id);
    if (!c) return null;
    if (patch.visibility && ['auto', 'shown', 'hidden'].includes(patch.visibility)) {
      c.visibility = patch.visibility;
    }
    persist();
    return c;
  }

  function deleteComment(id) {
    const s = load();
    s.comments = s.comments.filter((c) => c.id !== id);
    s.reactions = s.reactions.filter((r) => !(r.target_type === 'comment' && r.target_id === id));
    s.report_records = s.report_records.filter((r) => !(r.target_type === 'comment' && r.target_id === id));
    persist();
  }

  function countComments() {
    return load().comments.length;
  }

  // ---------- reactions (likes) ----------

  function getItem(targetType, targetId) {
    const s = load();
    return targetType === 'post'
      ? s.posts.find((p) => p.id === targetId)
      : s.comments.find((c) => c.id === targetId);
  }

  function hasLiked(anonId, targetType, targetId) {
    const s = load();
    return s.reactions.some(
      (r) => r.anon_id === anonId && r.target_type === targetType && r.target_id === targetId && r.kind === 'like'
    );
  }

  // Toggle like. Returns { liked: boolean, likes: number } or null if target missing.
  function toggleLike(anonId, targetType, targetId, { forAdmin = false } = {}) {
    const s = load();
    const item = getItem(targetType, targetId);
    if (!item) return null;
    const parent = targetType === 'post' ? item : s.posts.find((post) => post.id === item.post_id);
    if (!canReadPost(parent, { forAdmin })) return null;
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
  function likedIds(anonId, targetType, ids) {
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

  function hasReported(anonId, targetType, targetId) {
    const s = load();
    return s.report_records.some(
      (r) => r.anon_id === anonId && r.target_type === targetType && r.target_id === targetId
    );
  }

  function reportedIds(anonId, targetType, ids) {
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
  function createReport({ anon_id, target_type, target_id, category, reason, forAdmin = false }) {
    const s = load();
    const item = getItem(target_type, target_id);
    if (!item) return null;
    const parent = target_type === 'post' ? item : s.posts.find((post) => post.id === item.post_id);
    if (!canReadPost(parent, { forAdmin })) return null;
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

  function listReports({ resolved = false } = {}) {
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

  function resolveReports(targetType, targetId) {
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

  function countPendingReports() {
    const s = load();
    return s.report_records.filter((r) => !r.resolved).length;
  }

  // ---------- sections (user-created) ----------

  const MAX_SECTION_NAME = 20;

  function normalizeSectionName(raw) {
    return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, MAX_SECTION_NAME);
  }

  function listSections() {
    const s = load();
    return [...s.sections].sort((a, b) => a.created_at - b.created_at);
  }

  function getSection(id) {
    if (!id) return null;
    const s = load();
    return s.sections.find((x) => x.id === id) || null;
  }

  function findSectionByName(name) {
    const norm = normalizeSectionName(name);
    if (!norm) return null;
    const s = load();
    const lower = norm.toLowerCase();
    return s.sections.find((x) => x.name.toLowerCase() === lower) || null;
  }

  // Find by name (case-insensitive) or create a new section. Used by the post
  // API when a submitter types either an existing or a new section name.
  // Returns null for empty input.
  function getOrCreateSection(name) {
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
  function activeSectionIds() {
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

  function listEditorContacts() {
    const s = load();
    return [...s.editor_contacts].sort((a, b) => a.created_at - b.created_at);
  }

  function createEditorContact({ name, role, contact_label, contact_value }) {
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

  function updateEditorContact(id, patch) {
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

  function deleteEditorContact(id) {
    const s = load();
    const before = s.editor_contacts.length;
    s.editor_contacts = s.editor_contacts.filter((x) => x.id !== id);
    if (s.editor_contacts.length !== before) persist();
  }

  // ---------- blocked words ----------

  function listBlockedWords() {
    const s = load();
    return [...s.blocked_words].sort((a, b) => b.id - a.id);
  }

  function addBlockedWord(word) {
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

  function removeBlockedWord(id) {
    const s = load();
    s.blocked_words = s.blocked_words.filter((x) => x.id !== id);
    persist();
  }


  return { state, get dirty() { return dirty; }, operations: { getState, listPosts, listPendingPosts, countPendingPosts, getPost, createPost, publishPost, updatePost, deletePost, countPosts, recentPosts, listComments, getComment, createComment, updateComment, deleteComment, countComments, hasLiked, toggleLike, likedIds, hasReported, reportedIds, createReport, listReports, resolveReports, countPendingReports, listSections, getSection, findSectionByName, getOrCreateSection, activeSectionIds, listEditorContacts, createEditorContact, updateEditorContact, deleteEditorContact, listBlockedWords, addBlockedWord, removeBlockedWord } };
}
