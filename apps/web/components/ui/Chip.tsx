import * as React from 'react';
import { clsx } from './_clsx';

/**
 * Soft chip — used for feature list items (e.g. "BDIX 40G", "99.95% uptime")
 * in the hero trust strip and package cards.
 */
export function Chip({
  className,
  children,
  leading,
}: {
  className?: string;
  children: React.ReactNode;
  leading?: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-chip border border-subtle bg-surface/60 px-2.5 py-1 text-xs font-medium text-secondary backdrop-blur',
        className
      )}
    >
      {leading}
      {children}
    </span>
  );
}
