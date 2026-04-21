import type { Config } from 'tailwindcss';

/**
 * Tailwind config extends Tailwind's defaults with our design-token names so
 * `bg-surface` / `text-primary` / `border-subtle` in JSX resolve to the CSS
 * variables defined in `app/globals.css`. Adding a token here is the only
 * place we do so — don't hardcode hex colors in components.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic surfaces — prefer these over `slate-*`, `neutral-*`.
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          muted: 'var(--bg-surface-muted)',
          sunken: 'var(--bg-surface-sunken)',
        },
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        'on-brand': 'var(--text-on-brand)',

        // Brand ramp — keep `brand-600` as the only click-generating fill.
        brand: {
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          900: 'var(--brand-900)',
        },

        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)',
      },
      borderColor: {
        subtle:  'var(--border-subtle)',
        DEFAULT: 'var(--border-default)',
        strong:  'var(--border-strong)',
      },
      borderRadius: {
        // Restricted scale — chip 6, button/input 10, card 14, modal 20.
        chip:   '6px',
        input:  '10px',
        button: '10px',
        card:   '14px',
        modal:  '20px',
      },
      boxShadow: {
        // Only 3 elevations — `none`, `card`, `pop`.
        card: 'var(--elev-1)',
        pop:  'var(--elev-2)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        bn: ['var(--font-bn)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      // Musical 1.4 ratio type scale.
      fontSize: {
        caption: ['12px', { lineHeight: '1.4' }],
        small:   ['13px', { lineHeight: '1.5' }],
        body:    ['15px', { lineHeight: '1.55' }],
        'body-lg': ['17px', { lineHeight: '1.55' }],
        h3:      ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        h2:      ['28px', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        h1:      ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        display: ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      // Tailwind's default spacing scale is already an 8px-aligned grid
      // (plus 4px half-steps), so we don't override it here — that would
      // silently break every page using `p-4` etc. Style guide: prefer
      // multiples of 8 (2, 3, 4, 6, 8, 10, 12, 16, 24) in components.
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
