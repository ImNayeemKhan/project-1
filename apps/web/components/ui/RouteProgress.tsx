'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Subtle top-of-page progress bar that animates on every route change.
 * Uses native requestAnimationFrame — no NProgress dependency. Pinned
 * at the very top of the viewport above the header.
 *
 * Mechanics:
 * - The bar fills 0 → 80% quickly, then crawls 80 → 95% slowly (to feel
 *   like it's waiting on server work). When the pathname settles it
 *   finishes to 100% and fades out.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const raf = React.useRef<number | null>(null);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let p = 0;
    setVisible(true);
    setProgress(0);
    const step = () => {
      p += p < 80 ? 6 : 0.6;
      if (p >= 95) p = 95;
      setProgress(p);
      if (p < 95) raf.current = window.requestAnimationFrame(step);
    };
    raf.current = window.requestAnimationFrame(step);

    const finish = window.setTimeout(() => {
      if (raf.current) window.cancelAnimationFrame(raf.current);
      setProgress(100);
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220);
    }, 220);

    return () => {
      if (raf.current) window.cancelAnimationFrame(raf.current);
      window.clearTimeout(finish);
    };
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 180ms ease' }}
    >
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500 shadow-[0_0_12px_rgba(37,99,235,0.55)]"
        style={{
          width: `${progress}%`,
          transition: 'width 140ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      />
    </div>
  );
}
