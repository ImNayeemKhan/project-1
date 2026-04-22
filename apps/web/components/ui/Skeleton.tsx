import * as React from 'react';
import { clsx } from './_clsx';

/**
 * Neutral loading placeholder. Replaces "Loading…" text spans so the
 * layout doesn't reflow when real data arrives.
 *
 *   <Skeleton className="h-4 w-32" />       // single bar
 *   <Skeleton lines={3} className="w-full"/>// stacked text lines
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({ lines, className, ...rest }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={clsx('space-y-2', className)} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 rounded-[6px] bg-surface-muted anim-skeleton"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    );
  }
  return <div className={clsx('rounded-[8px] bg-surface-muted anim-skeleton', className)} {...rest} />;
}
