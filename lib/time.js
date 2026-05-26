// Locale-aware relative time. Takes the t() function from i18n so dictionaries stay in one place.
const pad = (n) => String(n).padStart(2, '0');

export function formatFull(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// `t` is the translator from lib/i18n. If omitted, falls back to keys.
export function formatRelative(ts, t = (k) => k, now = Date.now()) {
  const diff = Math.max(0, now - new Date(ts).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t('time.justNow');
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} ${t('time.minutes')}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${t('time.hours')}`;
  const day = Math.floor(hr / 24);
  if (day === 1) return t('time.yesterday');
  if (day < 7) return `${day} ${t('time.days')}`;
  if (day < 30) return `${Math.floor(day / 7)} ${t('time.weeks')}`;
  if (day < 365) return `${Math.floor(day / 30)} ${t('time.months')}`;
  return `${Math.floor(day / 365)} ${t('time.years')}`;
}
