// Legacy hidden messages were private on the old site. Keep that boundary
// separate from the new app's expandable moderation treatment.
export function canReadPost(post, { forAdmin = false } = {}) {
  return Boolean(post && (forAdmin || (post.status === 'published' && !post.legacy_private)));
}
