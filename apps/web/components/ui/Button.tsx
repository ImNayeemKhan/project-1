'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { clsx } from './_clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /**
   * Show a spinner and swallow clicks. Use this for any async submit
   * so every primary action has consistent pending feedback.
   */
  loading?: boolean;
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = CommonProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

type Props = ButtonProps | AnchorProps;

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out-expo whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-on-brand shadow-[0_1px_2px_rgba(10,10,10,0.12)] hover:bg-brand-700 hover:-translate-y-px hover:shadow-[0_8px_22px_-6px_rgba(37,99,235,0.55)]',
  secondary:
    'bg-surface text-primary border border-subtle hover:bg-surface-muted hover:-translate-y-px',
  ghost:
    'text-primary hover:bg-surface-muted',
  danger:
    'bg-danger text-white hover:opacity-90 hover:-translate-y-px',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-[8px]',
  md: 'h-10 px-4 text-sm rounded-[10px]',
  lg: 'h-12 px-6 text-[15px] rounded-[12px]',
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx('animate-spin', className)} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Inner({
  loading,
  leading,
  trailing,
  children,
}: {
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {loading ? <Spinner /> : leading}
      <span className={clsx('transition-opacity duration-150', loading && 'opacity-80')}>{children}</span>
      {!loading && trailing}
    </>
  );
}

/**
 * Premium button with a single visible primary per page. `variant="primary"`
 * is the one brand-filled CTA; everything else should be `secondary` or
 * `ghost`. Renders `<a>` automatically if `href` is provided. All variants
 * share a consistent press animation (whileTap scale 0.97) so every click
 * feels tactile.
 */
export function Button(props: Props) {
  const {
    variant = 'primary',
    size = 'md',
    className,
    children,
    leading,
    trailing,
    loading = false,
  } = props;
  const classes = clsx(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href !== undefined) {
    const { href, ...rest } = props as AnchorProps;
    const external = /^(https?:|mailto:|tel:|wa\.me)/i.test(href);
    const common = {
      className: classes,
      whileTap: { scale: 0.97 },
      transition: { type: 'spring' as const, stiffness: 420, damping: 26 },
    };
    if (external) {
      const MotionA = motion.a as unknown as React.FC<Record<string, unknown>>;
      return (
        <MotionA href={href} {...common} {...(rest as Record<string, unknown>)}>
          <Inner loading={loading} leading={leading} trailing={trailing}>
            {children}
          </Inner>
        </MotionA>
      );
    }
    const MotionA = motion.a as unknown as React.FC<Record<string, unknown>>;
    return (
      <Link href={href} legacyBehavior>
        <MotionA {...common}>
          <Inner loading={loading} leading={leading} trailing={trailing}>
            {children}
          </Inner>
        </MotionA>
      </Link>
    );
  }

  const { type, disabled, ...buttonRest } = props as ButtonProps;
  const MotionButton = motion.button as unknown as React.FC<Record<string, unknown>>;
  return (
    <MotionButton
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      {...(buttonRest as Record<string, unknown>)}
    >
      <Inner loading={loading} leading={leading} trailing={trailing}>
        {children}
      </Inner>
    </MotionButton>
  );
}
