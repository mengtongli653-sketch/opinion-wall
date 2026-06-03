'use client';

import { useT } from './LangProvider';

// Segmented control: Anonymous (default) vs Named.
// `onChange` receives { named: boolean, displayName: string }.
export default function IdentityPicker({ named, displayName, onChange }) {
  const t = useT();
  return (
    <div className="identity-picker">
      <div className="identity-label">{t('identity.label')}</div>
      <div className="identity-segmented" role="radiogroup" aria-label={t('identity.label')}>
        <button
          type="button"
          role="radio"
          aria-checked={!named}
          className={`identity-segment ${!named ? 'active' : ''}`}
          onClick={() => onChange({ named: false, displayName: '' })}
        >
          {t('identity.anonymous')}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={named}
          className={`identity-segment ${named ? 'active' : ''}`}
          onClick={() => onChange({ named: true, displayName })}
        >
          {t('identity.named')}
        </button>
      </div>
      {named && (
        <input
          type="text"
          className="identity-name-input"
          placeholder={t('identity.namePlaceholder')}
          value={displayName}
          maxLength={30}
          onChange={(e) => onChange({ named: true, displayName: e.target.value })}
        />
      )}
      <div className="identity-hint">{t('identity.hint')}</div>
    </div>
  );
}
