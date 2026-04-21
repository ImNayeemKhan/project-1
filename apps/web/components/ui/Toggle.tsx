'use client';
import * as React from 'react';
import { clsx } from './_clsx';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Optional small badge shown under the label, e.g. "−15%" savings. */
  hint?: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: Option<T>[];
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Segmented toggle used for billing-cycle, currency, and plan-type pickers
 * on /packages. Keyboard-navigable, focus-visible, single-primary fill.
 */
export function Toggle<T extends string>({ value, onChange, options, className, size = 'md' }: Props<T>) {
  return (
    <div
      className={clsx(
        'relative inline-flex rounded-[12px] border border-subtle bg-surface-muted p-1',
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'relative rounded-[10px] font-medium transition-all duration-150 ease-out-expo',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              active
                ? 'bg-surface text-primary shadow-card'
                : 'text-muted hover:text-secondary'
            )}
          >
            <span>{opt.label}</span>
            {opt.hint ? (
              <span className={clsx('ml-1.5 text-[10px] font-semibold', active ? 'text-brand-600' : 'text-subtle')}>
                {opt.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
