'use client';

import { useEffect } from 'react';

// Adds a body class so screen chrome (masthead / subnav / colophon) hides
// while on the print page, then auto-opens the browser print dialog. The
// user picks "Save as PDF" and gets a clean one-article PDF — no extra
// runtime deps and CJK fonts work natively.
export default function PrintTrigger() {
  useEffect(() => {
    document.body.classList.add('printing-mode');
    const id = window.setTimeout(() => {
      try { window.print(); } catch {}
    }, 350);
    return () => {
      window.clearTimeout(id);
      document.body.classList.remove('printing-mode');
    };
  }, []);
  return null;
}

export function PrintAgainButton({ label }) {
  return (
    <button
      type="button"
      className="secondary small"
      onClick={() => { try { window.print(); } catch {} }}
    >
      {label}
    </button>
  );
}
