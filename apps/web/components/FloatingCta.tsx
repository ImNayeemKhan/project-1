'use client';

import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';

export function FloatingCta() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div
        className={`pointer-events-auto flex flex-col items-end gap-2 transition-all duration-200 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <a
          href={BRAND.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-green-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20 4A10 10 0 0 0 4.1 16.3L3 21l4.8-1.1A10 10 0 1 0 20 4zM12 20a8 8 0 0 1-4-1.1l-.3-.2-2.8.7.7-2.7-.2-.3a8 8 0 1 1 6.6 3.6z" />
          </svg>
          WhatsApp
        </a>
        <a
          href={BRAND.primaryPhoneHref}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z" />
          </svg>
          Call {BRAND.primaryPhone}
        </a>
        <a
          href={BRAND.selfcareUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700"
        >
          Pay bill online
        </a>
      </div>

      <button
        type="button"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl ring-4 ring-white transition hover:bg-brand-700"
        aria-expanded={open}
        aria-label="Contact Desh Communications"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
    </div>
  );
}
