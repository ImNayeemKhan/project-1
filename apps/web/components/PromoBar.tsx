'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'desh.promo.dismissed';

export function PromoBar({
  message = 'Limited time — free installation + 1 month free on 12-month plans',
  ctaLabel = 'Claim offer',
  ctaHref = '/contact?promo=launch',
}: {
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setVisible(false);
  };

  return (
    <div className="relative z-40 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-2 text-sm">
        <span aria-hidden className="hidden sm:inline">🎉</span>
        <span>{message}</span>
        <Link
          href={ctaHref}
          className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur transition hover:bg-white/25"
        >
          {ctaLabel}
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss promo"
          className="ml-auto text-white/70 transition hover:text-white sm:ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}
