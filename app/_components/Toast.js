'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, text, kind: opts.kind || 'default' }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), opts.duration || 2200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'danger' ? 'danger' : ''}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const fn = useContext(ToastCtx);
  // Fallback in case provider is missing — no-op.
  return fn || (() => {});
}
