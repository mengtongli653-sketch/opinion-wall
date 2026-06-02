// Sections are now user-created. This module used to expose a curated
// hard-coded TAGS list — kept as a thin compatibility shim:
//   - TAGS / TAG_IDS stay exported but empty so any stale imports don't crash.
//   - normalizeTag still accepts any string and trims it; the real validation
//     (existence by id) happens at the API layer via getSection().
//   - getTag() is a soft lookup against a sections array the caller supplies.

export const TAGS = [];
export const TAG_IDS = [];

export function normalizeTag(raw) {
  if (!raw) return null;
  const v = String(raw).trim();
  return v || null;
}

// Convenience lookup against a sections array. Returns the section record or null.
export function getTag(id, sections) {
  if (!id || !Array.isArray(sections)) return null;
  return sections.find((s) => s.id === id) || null;
}
