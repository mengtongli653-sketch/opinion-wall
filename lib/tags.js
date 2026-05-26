// Curated tag list. id is stable (used in DB/URLs); labels come from i18n dict via key.
export const TAGS = [
  { id: 'chat',    emoji: '💬', i18nKey: 'tag.chat' },
  { id: 'help',    emoji: '🆘', i18nKey: 'tag.help' },
  { id: 'idea',    emoji: '💡', i18nKey: 'tag.idea' },
  { id: 'rec',     emoji: '❤️', i18nKey: 'tag.rec' },
  { id: 'news',    emoji: '🎉', i18nKey: 'tag.news' },
  { id: 'vent',    emoji: '😤', i18nKey: 'tag.vent' },
  { id: 'ask',     emoji: '❓', i18nKey: 'tag.ask' },
];

export const TAG_IDS = TAGS.map((t) => t.id);

export function getTag(id) {
  return TAGS.find((t) => t.id === id) || null;
}

export function normalizeTag(raw) {
  return TAG_IDS.includes(raw) ? raw : null;
}
