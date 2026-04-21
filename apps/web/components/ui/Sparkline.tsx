import * as React from 'react';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  /** 'brand' uses brand-500; 'success' / 'danger' use semantic colors. */
  color?: 'brand' | 'success' | 'danger' | 'muted';
  className?: string;
}

const COLOR: Record<NonNullable<Props['color']>, string> = {
  brand:   'var(--brand-500)',
  success: 'var(--success)',
  danger:  'var(--danger)',
  muted:   'var(--text-subtle)',
};

/**
 * Inline SVG line chart for KPI tiles. Deterministic — same data produces
 * same path on server + client, so it hydrates cleanly.
 */
export function Sparkline({ data, width = 120, height = 32, color = 'brand', className }: Props) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const stroke = COLOR[color];
  const fill = `url(#sparkline-fill-${color})`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`sparkline-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stroke} stopOpacity="0.20" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={fill}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
