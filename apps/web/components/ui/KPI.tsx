import * as React from 'react';
import { Sparkline } from './Sparkline';
import { clsx } from './_clsx';

interface KPIProps {
  label: string;
  value: string;
  delta?: { direction: 'up' | 'down' | 'flat'; label: string } | null;
  sparkline?: number[];
  /** Optional icon on the right of the label row. */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Dashboard KPI tile. Big value, tight label, optional month-over-month
 * delta chip, optional 30-point sparkline. Tabular numerals ensure the
 * value doesn't jitter when it updates.
 */
export function KPI({ label, value, delta, sparkline, icon, className }: KPIProps) {
  return (
    <div className={clsx('flex flex-col gap-3 rounded-card border border-subtle bg-surface p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
          {label}
        </div>
        {icon ? <div className="text-subtle">{icon}</div> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="font-display text-[28px] font-semibold leading-none tracking-[-0.01em] text-primary tabular-nums">
          {value}
        </div>
        {delta ? <DeltaChip delta={delta} /> : null}
      </div>
      {sparkline && sparkline.length > 1 ? (
        <Sparkline data={sparkline} />
      ) : null}
    </div>
  );
}

function DeltaChip({ delta }: { delta: NonNullable<KPIProps['delta']> }) {
  const colorClass =
    delta.direction === 'up'
      ? 'text-success bg-[rgba(5,150,105,0.10)]'
      : delta.direction === 'down'
      ? 'text-danger bg-[rgba(220,38,38,0.10)]'
      : 'text-muted bg-surface-muted';
  const arrow = delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→';
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-chip px-1.5 py-0.5 text-[11px] font-semibold', colorClass)}>
      <span aria-hidden>{arrow}</span>
      {delta.label}
    </span>
  );
}
