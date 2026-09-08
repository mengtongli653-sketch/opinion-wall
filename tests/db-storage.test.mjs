import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createDatabase } from '../lib/db-client.mjs';
import { emptyState } from '../lib/db-model.mjs';
import { canReadPost } from '../lib/post-access.mjs';
import { createStorage, createLocalStorage, createSupabaseStorage } from '../lib/db-storage.mjs';

function fakeSupabase(initialState = emptyState()) {
  let row = { version: 0, state: structuredClone(initialState) };
  const requests = [];
  let conflicts = 0;
  return {
    get row() { return structuredClone(row); },
    get conflicts() { return conflicts; },
    requests,
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (!options.method) return Response.json([structuredClone(row)]);
      const body = JSON.parse(options.body);
      if (body.p_expected_version !== row.version) {
        conflicts += 1;
        return Response.json(false);
      }
      row = { version: row.version + 1, state: structuredClone(body.p_state) };
      return Response.json(true);
    },
  };
}

function remoteDatabase(server) {
  const storage = createSupabaseStorage({
    url: 'https://test-project.supabase.co', serviceKey: 'test-service-key', fetchImpl: server.fetch,
  });
  return createDatabase(storage, { pause: async () => {} });
}

test('concurrent server instances retry conflicts and preserve both posts with unique IDs', async () => {
  const server = fakeSupabase();
  const first = remoteDatabase(server);
  const second = remoteDatabase(server);
  const posts = await Promise.all([
    first.createPost({ title: 'One', content: 'one', author_tag: 'a', kind: 'discussion', status: 'published' }),
    second.createPost({ title: 'Two', content: 'two', author_tag: 'b', kind: 'discussion', status: 'published' }),
  ]);
  assert.deepEqual(posts.map((post) => post.id).sort(), [1, 2]);
  assert.equal(server.row.state.posts.length, 2);
  assert.equal(server.row.state.meta.post_seq, 2);
  assert.ok(server.conflicts >= 1);
  assert.equal((await first.listPosts({ kind: 'discussion' })).length, 2);
  for (const { options } of server.requests) {
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.Authorization, 'Bearer test-service-key');
  }
});

test('concurrent reports from one identity cannot create duplicate reports or inflated totals', async () => {
  const server = fakeSupabase();
  const a = remoteDatabase(server);
  const b = remoteDatabase(server);
  const post = await a.createPost({ title: 'Example', content: 'body', status: 'published' });
  const report = { anon_id: 'same-reader', target_type: 'post', target_id: post.id, category: 'other', reason: 'review' };
  const results = await Promise.all([a.createReport(report), b.createReport(report)]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(server.row.state.report_records.length, 1);
  assert.equal((await a.getPost(post.id)).reports, 1);
});

test('concurrent section creation is deduplicated after a version conflict', async () => {
  const server = fakeSupabase();
  const a = remoteDatabase(server);
  const b = remoteDatabase(server);
  const sections = await Promise.all([a.getOrCreateSection('School'), b.getOrCreateSection('school')]);
  assert.equal(sections[0].id, sections[1].id);
  assert.equal(server.row.state.sections.length, 1);
});

test('post access distinguishes legacy privacy and pending submissions from expandable moderation', () => {
  assert.equal(canReadPost(null), false);
  assert.equal(canReadPost({ status: 'pending' }), false);
  assert.equal(canReadPost({ status: 'published', legacy_private: true }), false);
  assert.equal(canReadPost({ status: 'published', visibility: 'hidden' }), true);
  assert.equal(canReadPost({ status: 'pending', legacy_private: true }, { forAdmin: true }), true);
});

test('legacy private posts remain admin-only until an explicit show action', async () => {
  const state = emptyState();
  state.meta.post_seq = 1;
  state.posts = [{ id: 1, title: 'Old private message', content: 'Private', status: 'published', kind: 'discussion', legacy_id: 'old-1', legacy_is_hidden: true, legacy_private: true, visibility: 'hidden', created_at: 1 }];
  const server = fakeSupabase(state);
  const db = remoteDatabase(server);
  assert.equal((await db.listPosts({ kind: 'discussion' })).length, 0);
  assert.equal((await db.listPosts({ kind: 'discussion', forAdmin: true })).length, 1);
  assert.equal((await db.recentPosts()).length, 1);
  assert.equal(await db.createComment({ post_id: 1, content: 'Denied' }), null);
  assert.equal(await db.toggleLike('reader', 'post', 1), null);
  assert.equal(await db.createReport({ anon_id: 'reader', target_type: 'post', target_id: 1 }), null);
  assert.equal(server.row.version, 0);
  const reply = await db.createComment({ post_id: 1, content: 'Editor reply', forAdmin: true });
  assert.equal(reply.id, 1);
  assert.equal(await db.toggleLike('reader', 'comment', reply.id), null);
  assert.equal(await db.createReport({ anon_id: 'reader', target_type: 'comment', target_id: reply.id }), null);
  assert.ok(await db.toggleLike('editor', 'comment', reply.id, { forAdmin: true }));
  assert.ok(await db.createReport({ anon_id: 'editor', target_type: 'comment', target_id: reply.id, forAdmin: true }));
  await db.updatePost(1, { visibility: 'shown' });
  const shown = await db.getPost(1);
  assert.equal(shown.legacy_private, false);
  assert.equal(shown.legacy_is_hidden, true);
  assert.equal((await db.listPosts({ kind: 'discussion' })).length, 1);
  assert.ok(await db.createComment({ post_id: 1, content: 'Now public' }));
  await db.deletePost(1);
  assert.deepEqual((await db.getState()).meta.legacy_imported_ids, ['old-1']);
});

test('comment creation rechecks parent after a concurrent delete and does not save an orphan', async () => {
  const server = fakeSupabase();
  const other = remoteDatabase(server);
  const post = await other.createPost({ title: 'To delete', content: 'Body', status: 'published' });
  const storage = createSupabaseStorage({ url: 'https://test-project.supabase.co', serviceKey: 'test-service-key', fetchImpl: server.fetch });
  let deleteDuringSave = true;
  let saveAttempts = 0;
  const db = createDatabase({
    read: storage.read,
    compareAndSwap: async (version, state) => {
      saveAttempts += 1;
      if (deleteDuringSave) {
        deleteDuringSave = false;
        await other.deletePost(post.id);
      }
      return storage.compareAndSwap(version, state);
    },
  }, { pause: async () => {} });
  assert.equal(await db.createComment({ post_id: post.id, content: 'Should not survive' }), null);
  assert.equal(saveAttempts, 1);
  assert.equal(server.row.state.posts.length, 0);
  assert.equal(server.row.state.comments.length, 0);
  assert.equal(server.row.state.meta.comment_seq, 0);
});

test('conflicts stop after a bounded number of attempts without claiming a saved change', async () => {
  let attempts = 0;
  const db = createDatabase({
    read: async () => ({ version: 0, state: emptyState() }),
    compareAndSwap: async () => { attempts += 1; return false; },
  }, { maxAttempts: 3, pause: async () => {} });
  await assert.rejects(db.createPost({ title: 'Never saved' }), /not saved/);
  assert.equal(attempts, 3);
});

test('remote errors fail clearly and ambiguous writes are never retried', async () => {
  let writes = 0;
  const storage = createSupabaseStorage({
    url: 'https://test-project.supabase.co', serviceKey: 'test-service-key',
    fetchImpl: async (_url, options) => {
      if (!options.method) return Response.json([{ version: 0, state: emptyState() }]);
      writes += 1;
      throw new Error('network failed');
    },
  });
  await assert.rejects(createDatabase(storage).createPost({ title: 'Unknown result' }), /Cannot reach Supabase/);
  assert.equal(writes, 1);
  const unavailable = createSupabaseStorage({
    url: 'https://test-project.supabase.co', serviceKey: 'test-service-key',
    fetchImpl: async () => new Response('private details', { status: 401 }),
  });
  await assert.rejects(unavailable.read(), (error) => /HTTP 401/.test(error.message) && !error.message.includes('private details'));
});

test('Vercel and incomplete Supabase configurations cannot fall back to local disk', () => {
  assert.throws(() => createStorage({ env: { VERCEL: '1' } }), /requires/);
  assert.throws(() => createStorage({ env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co' } }), /requires/);
});

test('uninitialized or invalid remote state is rejected without writing a fresh board', async () => {
  for (const value of [[], [{ version: -1, state: {} }], [{ version: 0, state: null }]]) {
    let requests = 0;
    const storage = createSupabaseStorage({
      url: 'https://test-project.supabase.co', serviceKey: 'test-service-key',
      fetchImpl: async () => { requests += 1; return Response.json(value); },
    });
    await assert.rejects(createDatabase(storage).createPost({ title: 'Rejected' }), /not initialized|invalid/);
    assert.equal(requests, 1);
  }
});

test('local JSON compatibility includes old fields, fresh reads, publication, replies, and deletion', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'opinion-wall-storage-test-'));
  const filename = path.join(directory, 'data.json');
  try {
    const legacy = { meta: { post_seq: 1, comment_seq: 0, word_seq: 0 }, posts: [{ id: 1, title: 'Legacy', content: 'Body', created_at: 1, pinned: 0 }], comments: [], blocked_words: [] };
    await fs.writeFile(filename, JSON.stringify(legacy));
    const first = createDatabase(createLocalStorage(filename), { pause: async () => {} });
    const second = createDatabase(createLocalStorage(filename), { pause: async () => {} });
    assert.equal((await first.listPosts())[0].status, 'published');
    const pending = await first.createPost({ title: 'Pending', content: 'Body', author_tag: 'Anonymous' });
    assert.equal(pending.id, 2);
    assert.equal(await second.countPendingPosts(), 1);
    await second.publishPost(pending.id);
    const reply = await first.createComment({ post_id: pending.id, content: 'Reply', author_tag: 'Reader' });
    assert.equal((await second.listComments(pending.id))[0].id, reply.id);
    assert.equal((await first.toggleLike('reader', 'post', pending.id)).likes, 1);
    assert.ok((await second.likedIds('reader', 'post', [pending.id])).has(pending.id));
    await second.deletePost(pending.id);
    assert.equal(await first.getPost(pending.id), null);
    assert.equal(await first.countComments(), 0);
    const persisted = JSON.parse(await fs.readFile(filename, 'utf8'));
    assert.equal(persisted.posts[0].content, 'Body');
    assert.equal(persisted.posts[0].status, 'published');
  } finally {
    await fs.unlink(filename).catch(() => {});
    await fs.rmdir(directory);
  }
});

test('invalid local JSON is not silently reset or overwritten', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'opinion-wall-storage-test-'));
  const filename = path.join(directory, 'data.json');
  try {
    await fs.writeFile(filename, '{invalid');
    const db = createDatabase(createLocalStorage(filename));
    await assert.rejects(db.createPost({ title: 'Rejected' }), /invalid JSON/);
    assert.equal(await fs.readFile(filename, 'utf8'), '{invalid');
  } finally {
    await fs.unlink(filename);
    await fs.rmdir(directory);
  }
});
