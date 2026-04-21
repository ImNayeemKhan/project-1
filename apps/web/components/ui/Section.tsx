import * as React from 'react';
import { clsx } from './_clsx';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** 'surface' flips the bg to the surface token for alternating rhythm. */
  variant?: 'canvas' | 'surface' | 'sunken';
  tight?: boolean;
}

/**
 * Page section with consistent vertical rhythm + optional background
 * variant. Use sparingly — alternating canvas / surface keeps long pages
 * legible without extra dividers.
 */
export function Section({ variant = 'canvas', tight, className, children, ...rest }: SectionProps) {
  const bg =
    variant === 'surface' ? 'bg-surface' : variant === 'sunken' ? 'bg-surface-sunken' : 'bg-canvas';
  return (
    <section className={clsx(bg, tight ? 'py-14' : 'py-24', className)} {...rest}>
      {children}
    </section>
  );
}
