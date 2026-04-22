'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'desh.exitintent.shown';

/**
 * Fires once per session when the mouse leaves the top of the viewport
 * (or after 45s dwell time on mobile, where exit intent doesn't apply).
 * Offers a named discount code so sales can attribute redemptions back.
 */
export function ExitIntentModal({
  code = 'SAVE10',
  discount = '10% off your first 3 months',
}: {
  code?: string;
  discount?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === '1') return;

    const trigger = () => {
      if (window.sessionStorage.getItem(STORAGE_KEY) === '1') return;
      window.sessionStorage.setItem(STORAGE_KEY, '1');
      setOpen(true);
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };

    const isTouch = window.matchMedia('(hover: none)').matches;
    const mobileTimer = isTouch ? window.setTimeout(trigger, 45_000) : null;

    document.addEventListener('mouseout', onMouseOut);
    return () => {
      document.removeEventListener('mouseout', onMouseOut);
      if (mobileTimer) window.clearTimeout(mobileTimer);
    };
  }, []);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-brand-600 to-brand-500 p-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Hold on!</div>
          <div className="mt-1 text-2xl font-bold leading-tight">
            Before you go, here&apos;s {discount}
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600">
            Use this code on your first payment. Valid for new connections activated within 14 days.
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-brand-400 bg-brand-50 p-3">
            <code className="flex-1 font-mono text-lg font-bold text-brand-700">{code}</code>
            <button
              onClick={copy}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/contact?promo=${code}`}
              className="btn-primary flex-1 justify-center"
              onClick={() => setOpen(false)}
            >
              Get connected
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="btn border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
