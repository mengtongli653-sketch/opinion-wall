'use client';

import { TAGS } from '@/lib/tags';
import { useT } from './LangProvider';

export default function TagPicker({ value, onChange }) {
  const t = useT();
  return (
    <div>
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>{t('compose.tagLabel')}</div>
      <div className="chip-row">
        {TAGS.map((tag) => (
          <button
            type="button"
            key={tag.id}
            className={`chip ${value === tag.id ? 'active' : ''}`}
            onClick={() => onChange(value === tag.id ? null : tag.id)}
          >
            <span>{t(tag.i18nKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
