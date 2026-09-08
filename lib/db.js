import { createStorage } from './db-storage.mjs';
import { createDatabase } from './db-client.mjs';

// Initialize at request time so builds do not need access to production data.
let database;
function db() {
  if (typeof window !== 'undefined') throw new Error('Board storage is server-only.');
  if (!database) database = createDatabase(createStorage());
  return database;
}

export async function getState(...args) { return db().getState(...args); }
export async function listPosts(...args) { return db().listPosts(...args); }
export async function listPendingPosts(...args) { return db().listPendingPosts(...args); }
export async function countPendingPosts(...args) { return db().countPendingPosts(...args); }
export async function getPost(...args) { return db().getPost(...args); }
export async function createPost(...args) { return db().createPost(...args); }
export async function publishPost(...args) { return db().publishPost(...args); }
export async function updatePost(...args) { return db().updatePost(...args); }
export async function deletePost(...args) { return db().deletePost(...args); }
export async function countPosts(...args) { return db().countPosts(...args); }
export async function recentPosts(...args) { return db().recentPosts(...args); }
export async function listComments(...args) { return db().listComments(...args); }
export async function getComment(...args) { return db().getComment(...args); }
export async function createComment(...args) { return db().createComment(...args); }
export async function updateComment(...args) { return db().updateComment(...args); }
export async function deleteComment(...args) { return db().deleteComment(...args); }
export async function countComments(...args) { return db().countComments(...args); }
export async function hasLiked(...args) { return db().hasLiked(...args); }
export async function toggleLike(...args) { return db().toggleLike(...args); }
export async function likedIds(...args) { return db().likedIds(...args); }
export async function hasReported(...args) { return db().hasReported(...args); }
export async function reportedIds(...args) { return db().reportedIds(...args); }
export async function createReport(...args) { return db().createReport(...args); }
export async function listReports(...args) { return db().listReports(...args); }
export async function resolveReports(...args) { return db().resolveReports(...args); }
export async function countPendingReports(...args) { return db().countPendingReports(...args); }
export async function listSections(...args) { return db().listSections(...args); }
export async function getSection(...args) { return db().getSection(...args); }
export async function findSectionByName(...args) { return db().findSectionByName(...args); }
export async function getOrCreateSection(...args) { return db().getOrCreateSection(...args); }
export async function activeSectionIds(...args) { return db().activeSectionIds(...args); }
export async function listEditorContacts(...args) { return db().listEditorContacts(...args); }
export async function createEditorContact(...args) { return db().createEditorContact(...args); }
export async function updateEditorContact(...args) { return db().updateEditorContact(...args); }
export async function deleteEditorContact(...args) { return db().deleteEditorContact(...args); }
export async function listBlockedWords(...args) { return db().listBlockedWords(...args); }
export async function addBlockedWord(...args) { return db().addBlockedWord(...args); }
export async function removeBlockedWord(...args) { return db().removeBlockedWord(...args); }
