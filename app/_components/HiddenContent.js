'use client';

import { useState } from 'react';
import { useT } from './LangProvider';

export default function HiddenContent({ children, reason }) {
  const t = useT();
  const [shown, setShown] = useState(false);
  if (shown) {
    return (
      <div>
        <div className="hidden-banner">
          <span>⚠️ {t('hidden.shown')}</span>
          <button type="button" className="ghost small" onClick={() => setShown(false)}>{t('hidden.hideAgain')}</button>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="hidden-placeholder">
      <div className="emoji">🛑</div>
      <div className="title">{t('hidden.title')}</div>
      <div className="sub">{reason || t('hidden.sub')}</div>
      <button type="button" className="ghost small" onClick={() => setShown(true)}>
        {t('hidden.showAnyway')}
      </button>
    </div>
  );
}
