import * as React from 'react';
import { clsx } from './_clsx';

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Standard section header: eyebrow / H2 / supporting body. Used across the
 * marketing site so every section opens with the same visual rhythm.
 */
export function SectionHeading({ eyebrow, title, body, align = 'left', className }: Props) {
  return (
    <div className={clsx(align === 'center' && 'text-center', 'max-w-[640px]', align === 'center' && 'mx-auto', className)}>
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-subtle bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 anim-pulse-dot" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.015em] text-primary md:text-[36px]">
        {title}
      </h2>
      {body ? <p className="mt-3 text-[16px] leading-[1.55] text-secondary md:text-[17px]">{body}</p> : null}
    </div>
  );
}
