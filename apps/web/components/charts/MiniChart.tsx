'use client';

/**
 * Tiny dependency-free SVG charts. Intentionally lightweight so the admin
 * bundle doesn't balloon. Accepts pre-aggregated series from the BI API.
 */

export function Sparkline({
  points,
  width = 180,
  height = 48,
  stroke = '#0ea5e9',
  fill = 'rgba(14,165,233,0.15)',
}: {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const step = width / Math.max(points.length - 1, 1);
  const y = (v: number) => height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function BarChart({
  labels,
  values,
  width = 520,
  height = 180,
  color = '#0ea5e9',
}: {
  labels: string[];
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const barW = Math.max(8, Math.floor((width - 40) / values.length) - 6);
  const gap = 6;
  const chartH = height - 28;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      {/* grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={32}
          x2={width - 4}
          y1={chartH - chartH * f + 4}
          y2={chartH - chartH * f + 4}
          stroke="#e2e8f0"
          strokeDasharray="3 3"
        />
      ))}
      {values.map((v, i) => {
        const h = (v / max) * (chartH - 8);
        const x = 32 + i * (barW + gap);
        const y = chartH - h + 4;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={2} fill={color} opacity={0.85}>
              <title>
                {labels[i]}: {v.toLocaleString()}
              </title>
            </rect>
            <text
              x={x + barW / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
            >
              {labels[i].slice(-5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  items,
  size = 180,
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;
  const arcs = items.map((it) => {
    const frac = it.value / total;
    const next = angle + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(next);
    const y2 = cy + r * Math.sin(next);
    const d = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    angle = next;
    return { ...it, d, frac };
  });
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color}>
            <title>
              {a.label}: {a.value.toLocaleString()} ({(a.frac * 100).toFixed(1)}%)
            </title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="white" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={11} fill="#64748b">
          Total
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={14} fontWeight={600} fill="#0f172a">
          {total.toLocaleString()}
        </text>
      </svg>
      <ul className="space-y-1 text-sm">
        {arcs.map((a, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: a.color }} />
            <span className="text-slate-700">{a.label}</span>
            <span className="ml-auto font-medium text-slate-900">
              {(a.frac * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
