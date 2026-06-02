'use client';

import { useEffect, useState } from 'react';
import { useT } from './LangProvider';

const MAX_NAME = 20;

// Sections are user-created now. The picker:
//   - fetches /api/sections on mount,
//   - lets the user select an existing one (chip),
//   - or type a new name in the input,
//   - or skip both (means "no section").
// State is bubbled up to NewPostForm as a single string `value` (the name
// of the chosen-or-typed section). NewPostForm sends it as tag_name and
// the server does the find-or-create.
export default function TagPicker({ value, onChange }) {
  const t = useT();
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sections')
      .then((r) => r.ok ? r.json() : { sections: [] })
      .then((data) => {
        if (!cancelled) {
          setSections(Array.isArray(data.sections) ? data.sections : []);
          setLoaded(true);
        }
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const normalized = (value || '').trim();
  const matchingExisting = sections.find(
    (s) => s.name.toLowerCase() === normalized.toLowerCase()
  );
  const isNewName = normalized.length > 0 && !matchingExisting;

  return (
    <div>
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>
        {t('compose.tagLabel')}
      </div>

      {loaded && sections.length === 0 && (
        <div
          className="muted"
          style={{ fontSize: 12.5, fontStyle: 'italic', marginBottom: 8 }}
        >
          {t('section.empty')}
        </div>
      )}

      {sections.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {sections.map((sec) => {
            const active = normalized.toLowerCase() === sec.name.toLowerCase();
            return (
              <button
                type="button"
                key={sec.id}
                className={`chip ${active ? 'active' : ''}`}
                onClick={() => onChange(active ? '' : sec.name)}
              >
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          maxLength={MAX_NAME + 10}
          placeholder={t('section.namePlaceholder')}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
        />
        {isNewName && (
          <span
            className="badge"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            {t('section.willCreate')}
          </span>
        )}
      </div>
    </div>
  );
}
