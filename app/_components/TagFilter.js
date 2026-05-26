'use client';

import { TAGS } from '@/lib/tags';
import { useT } from './LangProvider';

export default function TagFilter({ active }) {
  const t = useT();
  return (
    <div className="chip-row" style={{ margin: '6px 0 14px' }}>
      <a
        href="/"
        className={`chip ${!active ? 'active' : ''}`}
      >
        <span>{t('home.tag.all')}</span>
      </a>
      {TAGS.map((tag) => (
        <a
          key={tag.id}
          href={`/?tag=${tag.id}`}
          className={`chip ${active === tag.id ? 'active' : ''}`}
        >
          <span aria-hidden>{tag.emoji}</span>
          <span>{t(tag.i18nKey)}</span>
        </a>
      ))}
    </div>
  );
}
