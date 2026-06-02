'use client';

import { TAGS } from '@/lib/tags';
import { useT } from './LangProvider';

export default function TagFilter({ active }) {
  const t = useT();
  return (
    <nav className="section-nav" aria-label="sections">
      <a href="/" className={!active ? 'active' : ''}>
        {t('home.tag.all')}
      </a>
      {TAGS.map((tag) => (
        <a
          key={tag.id}
          href={`/?tag=${tag.id}`}
          className={active === tag.id ? 'active' : ''}
        >
          {t(tag.i18nKey)}
        </a>
      ))}
    </nav>
  );
}
