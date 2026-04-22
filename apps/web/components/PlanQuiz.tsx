'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PackageRow } from './PackageFilterGrid';

type Use = 'browsing' | 'streaming' | 'gaming' | 'work';
type Size = '1-2' | '3-4' | '5+';
type Budget = 'low' | 'mid' | 'premium';
type Speed = 'basic' | 'fast' | 'blazing';

interface Answers {
  use?: Use;
  size?: Size;
  budget?: Budget;
  speed?: Speed;
}

const QUESTIONS: {
  key: keyof Answers;
  q: string;
  options: { value: string; label: string; hint?: string }[];
}[] = [
  {
    key: 'use',
    q: 'What will you use the connection for most?',
    options: [
      { value: 'browsing', label: 'Browsing & social' },
      { value: 'streaming', label: 'Streaming & Netflix' },
      { value: 'gaming', label: 'Online gaming' },
      { value: 'work', label: 'Work from home / office' },
    ],
  },
  {
    key: 'size',
    q: 'How many people share the line?',
    options: [
      { value: '1-2', label: '1–2 people' },
      { value: '3-4', label: '3–4 people' },
      { value: '5+', label: '5+ people or office' },
    ],
  },
  {
    key: 'speed',
    q: 'How fast do you actually need?',
    options: [
      { value: 'basic', label: 'Good enough (30–50 Mbps)' },
      { value: 'fast', label: 'Fast (60–100 Mbps)' },
      { value: 'blazing', label: 'Blazing (150 Mbps+)' },
    ],
  },
  {
    key: 'budget',
    q: 'What monthly budget works for you?',
    options: [
      { value: 'low', label: 'Under ৳1,000' },
      { value: 'mid', label: '৳1,000 – ৳2,000' },
      { value: 'premium', label: '৳2,000+' },
    ],
  },
];

function score(pkg: PackageRow, a: Answers): number {
  let s = 0;
  // Category fit.
  if (a.use === 'gaming' && pkg.category === 'gaming') s += 6;
  if (a.use === 'work' && pkg.category === 'corporate') s += 4;
  if ((a.use === 'browsing' || a.use === 'streaming') && (pkg.category === 'personal' || !pkg.category)) s += 3;

  // Speed fit.
  if (a.speed === 'basic' && pkg.downloadMbps <= 50) s += 4;
  if (a.speed === 'fast' && pkg.downloadMbps >= 50 && pkg.downloadMbps <= 100) s += 5;
  if (a.speed === 'blazing' && pkg.downloadMbps >= 120) s += 6;

  // Household size.
  if (a.size === '1-2' && pkg.downloadMbps <= 60) s += 2;
  if (a.size === '3-4' && pkg.downloadMbps >= 40 && pkg.downloadMbps <= 120) s += 3;
  if (a.size === '5+' && pkg.downloadMbps >= 100) s += 4;

  // Budget fit.
  if (a.budget === 'low' && pkg.monthlyPrice < 1000) s += 4;
  if (a.budget === 'mid' && pkg.monthlyPrice >= 1000 && pkg.monthlyPrice <= 2000) s += 4;
  if (a.budget === 'premium' && pkg.monthlyPrice > 2000) s += 3;

  // Featured nudge for tiebreakers.
  if (pkg.isFeatured) s += 1;
  return s;
}

export function PlanQuiz({ packages }: { packages: PackageRow[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const recommended = useMemo(() => {
    if (step < QUESTIONS.length) return null;
    const scored = packages
      .map((p) => ({ pkg: p, s: score(p, answers) }))
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, 2).map((x) => x.pkg);
  }, [step, answers, packages]);

  const current = QUESTIONS[step];

  const pick = (value: string) => {
    const next = { ...answers, [current.key]: value } as Answers;
    setAnswers(next);
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Find your perfect plan</h3>
          <p className="text-sm text-slate-500">Four quick questions — under 30 seconds.</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {step < QUESTIONS.length ? `Step ${step + 1} of ${QUESTIONS.length}` : 'Result'}
        </div>
      </div>

      {current ? (
        <div>
          <div className="mb-4 text-lg font-medium text-slate-900">{current.q}</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {current.options.map((o) => (
              <button
                key={o.value}
                onClick={() => pick(o.value)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50"
              >
                <div className="font-semibold">{o.label}</div>
                {o.hint && <div className="mt-1 text-xs text-slate-500">{o.hint}</div>}
              </button>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm text-slate-500">Based on your answers, these fit best:</div>
          {recommended && recommended.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recommended.map((p, i) => (
                <div
                  key={p._id}
                  className={`rounded-xl border p-5 ${
                    i === 0 ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  {i === 0 && (
                    <div className="mb-2 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Best match
                    </div>
                  )}
                  <div className="text-lg font-semibold text-slate-900">{p.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {p.downloadMbps} / {p.uploadMbps} Mbps · {p.fupGB ? `${p.fupGB} GB` : 'Unlimited'}
                  </div>
                  <div className="mt-3 text-2xl font-bold text-brand-700">৳{p.monthlyPrice}</div>
                  <Link
                    href={`/contact?packageInterest=${p._id}&source=quiz`}
                    className="btn-primary mt-4 w-full justify-center"
                  >
                    Get {p.name}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No packages available — please try again later or browse the{' '}
              <Link href="/packages" className="text-brand-600 hover:underline">
                full list
              </Link>
              .
            </p>
          )}
          <button onClick={reset} className="mt-5 text-sm text-slate-500 hover:text-slate-700 hover:underline">
            ← retake the quiz
          </button>
        </div>
      )}
    </div>
  );
}
