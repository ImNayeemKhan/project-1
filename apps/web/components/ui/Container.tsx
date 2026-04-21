import * as React from 'react';
import { clsx } from './_clsx';

/**
 * 1200px max-width content column with responsive horizontal gutter.
 * Exactly one rule applies; no exceptions throughout the app.
 */
export function Container({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mx-auto w-full max-w-[1200px] px-6', className)} {...rest}>
      {children}
    </div>
  );
}
