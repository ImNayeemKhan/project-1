'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from './_clsx';

/**
 * Inline copy-to-clipboard button used for admin URLs, invoice numbers,
 * API tokens, etc. Shows a success checkmark for 1.2s on successful
 * copy. Falls back gracefully if `navigator.clipboard` is unavailable.
 */
export function CopyButton({
  value,
  label = 'Copy',
  size = 'sm',
  className,
}: {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  async function onClick() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fail silently — not worth a whole error toast
    }
  }

  const h = size === 'md' ? 'h-9 px-3 text-sm' : 'h-7 px-2 text-xs';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? 'Copied' : `Copy ${label}`}
      className={clsx(
        'relative inline-flex items-center gap-1.5 rounded-[8px] border border-subtle bg-surface font-medium text-primary transition-all duration-150 hover:bg-surface-muted active:scale-[0.97]',
        h,
        className,
      )}
    >
      <span className="relative h-3.5 w-3.5">
        <AnimatePresence initial={false} mode="wait">
          {copied ? (
            <motion.svg
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="absolute inset-0 text-emerald-600"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="copy"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute inset-0"
              aria-hidden
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}
