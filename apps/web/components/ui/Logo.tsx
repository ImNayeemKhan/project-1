import * as React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { clsx } from './_clsx';

/**
 * Company logo — unified across marketing, admin, and customer shells.
 * Renders as a <Link> by default so top-left click returns to `/`.
 */
export function Logo({
  className,
  href = '/',
  size = 'md',
  onlyMark = false,
}: {
  className?: string;
  href?: string | false;
  size?: 'sm' | 'md' | 'lg';
  /** Hide wordmark; show only the square mark (for tight sidebars). */
  onlyMark?: boolean;
}) {
  const h = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-10' : 'h-8';
  const content = (
    <span className={clsx('flex items-center gap-2', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={onlyMark ? BRAND.logoSquareUrl : BRAND.logoUrl}
        alt={`${BRAND.name} logo`}
        className={clsx('w-auto', h)}
      />
      <span className="sr-only">{BRAND.name}</span>
    </span>
  );
  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
