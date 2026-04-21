import * as React from 'react';
import Link from 'next/link';
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
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = CommonProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

type Props = ButtonProps | AnchorProps;

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out-expo whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-on-brand shadow-[0_1px_2px_rgba(10,10,10,0.12)] hover:bg-brand-700 hover:-translate-y-px hover:shadow-[0_6px_16px_-4px_rgba(37,99,235,0.4)] active:translate-y-0',
  secondary:
    'bg-surface text-primary border border-subtle hover:bg-surface-muted',
  ghost:
    'text-primary hover:bg-surface-muted',
  danger:
    'bg-danger text-white hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-[8px]',
  md: 'h-10 px-4 text-sm rounded-[10px]',
  lg: 'h-12 px-6 text-[15px] rounded-[12px]',
};

/**
 * Premium button with a single visible primary per page. `variant="primary"`
 * is the one brand-filled CTA; everything else should be `secondary` or
 * `ghost`. Renders `<a>` automatically if `href` is provided.
 */
export function Button(props: Props) {
  const { variant = 'primary', size = 'md', className, children, leading, trailing } = props;
  const classes = clsx(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href !== undefined) {
    const { href, ...rest } = props as AnchorProps;
    // Next `<Link>` for in-app navigation, plain <a> for external / tel: / mailto:
    const external = /^(https?:|mailto:|tel:|wa\.me)/i.test(href);
    if (external) {
      return (
        <a href={href} className={classes} {...rest as React.AnchorHTMLAttributes<HTMLAnchorElement>}>
          {leading}
          {children}
          {trailing}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {leading}
        {children}
        {trailing}
      </Link>
    );
  }

  const { type, ...buttonRest } = props as ButtonProps;
  return (
    <button type={type ?? 'button'} className={classes} {...buttonRest}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}
