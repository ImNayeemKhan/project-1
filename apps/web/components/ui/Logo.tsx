import * as React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { clsx } from './_clsx';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'hero';

const SIZE_MAP: Record<LogoSize, string> = {
  // Original compact scale — kept for tight sidebars only
  xs: 'h-8',
  sm: 'h-12',
  md: 'h-16',
  lg: 'h-20',
  // New prominence scale — used across header / footer / hero
  xl: 'h-24',
  '2xl': 'h-32',
  '3xl': 'h-48',
  hero: 'h-64 md:h-80',
};

/**
 * Company logo — unified across marketing, admin, and customer shells.
 * Renders as a <Link> by default so top-left click returns to `/`.
 *
 * Sizes have been scaled up so the brand carries real presence:
 *   - admin / customer sidebar:  md  (64px)
 *   - marketing header:          xl  (scroll: lg, top: xl)
 *   - marketing footer / login:  2xl (128px)
 *   - hero landing:              hero (256 → 320px — the "dominant" slot)
 */
export function Logo({
  className,
  href = '/',
  size = 'xl',
  onlyMark = false,
  glow = false,
}: {
  className?: string;
  href?: string | false;
  size?: LogoSize;
  /** Hide wordmark; show only the square mark (for tight sidebars). */
  onlyMark?: boolean;
  /** Add a soft breathing glow — used on hero/login. */
  glow?: boolean;
}) {
  const content = (
    <span className={clsx('inline-flex items-center', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={onlyMark ? BRAND.logoSquareUrl : BRAND.logoUrl}
        alt={`${BRAND.name} logo`}
        className={clsx('w-auto', SIZE_MAP[size], glow && 'anim-breathe')}
      />
      <span className="sr-only">{BRAND.name}</span>
    </span>
  );
  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
