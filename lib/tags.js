// Curated tag list. id is stable (used in DB/URLs); labels come from i18n dict via key.
export const TAGS = [
  { id: 'chat', i18nKey: 'tag.chat' },
  { id: 'help', i18nKey: 'tag.help' },
  { id: 'idea', i18nKey: 'tag.idea' },
  { id: 'rec',  i18nKey: 'tag.rec' },
  { id: 'news', i18nKey: 'tag.news' },
  { id: 'vent', i18nKey: 'tag.vent' },
  { id: 'ask',  i18nKey: 'tag.ask' },
];

export const TAG_IDS = TAGS.map((t) => t.id);

export function getTag(id) {
  return TAGS.find((t) => t.id === id) || null;
}

export function normalizeTag(raw) {
  return TAG_IDS.includes(raw) ? raw : null;
}
