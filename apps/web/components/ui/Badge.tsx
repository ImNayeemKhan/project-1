import * as React from 'react';
import { clsx } from './_clsx';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-secondary',
  brand:   'bg-brand-50 text-brand-700',
  success: 'bg-[rgba(5,150,105,0.10)] text-success',
  warning: 'bg-[rgba(217,119,6,0.12)] text-warning',
  danger:  'bg-[rgba(220,38,38,0.10)] text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
