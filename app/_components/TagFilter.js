'use client';

import { useT } from './LangProvider';

// Server passes in the list of sections that are actually in use (≥1
// published article). If empty, the filter bar disappears entirely so
// the front page doesn't show a lonely "All" tab.
export default function TagFilter({ active, sections = [] }) {
  const t = useT();
  if (sections.length === 0) return null;
  return (
    <nav className="section-nav" aria-label="sections">
      <a href="/" className={!active ? 'active' : ''}>
        {t('home.tag.all')}
      </a>
      {sections.map((sec) => (
        <a
          key={sec.id}
          href={`/?tag=${sec.id}`}
          className={active === sec.id ? 'active' : ''}
        >
          {sec.name}
        </a>
      ))}
    </nav>
  );
}
