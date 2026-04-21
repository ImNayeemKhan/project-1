'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

// Areas we know we already serve + ETA tier. Source of truth for the
// coverage checker on the marketing site. Keep these lowercase so matching
// is case-insensitive.
const COVERED: { area: string; etaHours: string; zone: string }[] = [
  { area: 'mohammadpur', etaHours: '4–6h', zone: 'Mohammadpur Core' },
  { area: 'mohammadia housing', etaHours: '4–6h', zone: 'Mohammadpur Core' },
  { area: 'dhanmondi', etaHours: '6–12h', zone: 'Dhanmondi' },
  { area: 'adabor', etaHours: '6–12h', zone: 'Adabor' },
  { area: 'lalmatia', etaHours: '6–12h', zone: 'Lalmatia' },
  { area: 'shyamoli', etaHours: '12–24h', zone: 'Mirpur Belt' },
  { area: 'mirpur', etaHours: '12–24h', zone: 'Mirpur Belt' },
  { area: 'kallyanpur', etaHours: '12–24h', zone: 'Mirpur Belt' },
  { area: 'agargaon', etaHours: '24–48h', zone: 'Expansion' },
  { area: 'farmgate', etaHours: '24–48h', zone: 'Expansion' },
  { area: 'tejgaon', etaHours: '24–48h', zone: 'Expansion' },
];

type Result =
  | { kind: 'idle' }
  | { kind: 'covered'; zone: string; etaHours: string; area: string }
  | { kind: 'uncovered'; area: string };

export function CoverageChecker() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return COVERED.filter((c) => c.area.includes(q)).slice(0, 5);
  }, [input]);

  const check = (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;
    const match = COVERED.find((c) => q.includes(c.area) || c.area.includes(q));
    if (match) {
      setResult({ kind: 'covered', zone: match.zone, etaHours: match.etaHours, area: raw });
    } else {
      setResult({ kind: 'uncovered', area: raw });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Live coverage check
      </div>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">Check availability at your address</h3>
      <p className="mt-1 text-sm text-slate-600">
        Type your area or landmark — we&apos;ll tell you if fiber is lit on your block.
      </p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          check(input);
        }}
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="e.g. Mohammadpur, Dhanmondi 15/A, Shyamoli"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (result.kind !== 'idle') setResult({ kind: 'idle' });
          }}
        />
        <button type="submit" className="btn-primary" disabled={!input.trim()}>
          Check coverage
        </button>
      </form>

      {suggestions.length > 0 && result.kind === 'idle' && (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {suggestions.map((s) => (
            <button
              key={s.area}
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => {
                setInput(s.area);
                check(s.area);
              }}
            >
              {s.area}
            </button>
          ))}
        </div>
      )}

      {result.kind === 'covered' && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <div className="font-semibold">Covered — {result.zone}</div>
          <div className="mt-1">
            Survey ETA: <span className="font-medium">{result.etaHours}</span>. Typical install completes
            within 24–48h of survey approval.
          </div>
          <Link href="/contact" className="btn-primary mt-3 inline-flex">
            Book installation
          </Link>
        </div>
      )}

      {result.kind === 'uncovered' && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <div className="font-semibold">Not lit yet — we&apos;ll add you to our expansion list</div>
          <div className="mt-1">
            Share your details on the contact form. If we get enough demand on your road we schedule a
            fiber extension within 2–6 weeks.
          </div>
          <Link href="/contact" className="btn-primary mt-3 inline-flex">
            Request expansion
          </Link>
        </div>
      )}
    </div>
  );
}
