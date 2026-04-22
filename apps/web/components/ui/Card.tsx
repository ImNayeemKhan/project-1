import * as React from 'react';
import { clsx } from './_clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `interactive` adds hover-lift; `elevated` adds a baseline shadow. */
  variant?: 'flat' | 'elevated' | 'interactive' | 'featured';
  padded?: boolean;
}

/**
 * All panels use Card — consistent radius (14px), hairline border, and
 * exactly one elevation level. `variant="featured"` adds a shimmering brand
 * border for the "most chosen" plan card.
 */
export function Card({
  className,
  variant = 'flat',
  padded = true,
  children,
  ...rest
}: CardProps) {
  const base = 'relative bg-surface rounded-card border border-subtle';
  const v =
    variant === 'elevated'
      ? 'shadow-card'
      : variant === 'interactive'
      ? 'transition-all duration-150 ease-out-expo hover:-translate-y-px hover:shadow-pop'
      : variant === 'featured'
      ? 'anim-shimmer-border border-brand-500/30 shadow-pop'
      : '';
  return (
    <div className={clsx(base, v, padded && 'p-6', className)} {...rest}>
      {children}
    </div>
  );
}
