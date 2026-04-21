'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PackageRow } from './PackageFilterGrid';

type Family = 'personal' | 'gaming' | 'corporate';

/**
 * Side-by-side comparison of the top 4 plans in each family. Useful on the
 * pricing page for visitors who want a quick "what's the difference"
 * view before clicking through to package cards.
 */
export function PricingComparisonTable({ packages }: { packages: PackageRow[] }) {
  const [family, setFamily] = useState<Family>('personal');

  const columns = useMemo(() => {
    const filtered = packages
      .filter((p) => (p.category ?? 'personal') === family)
      .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    return filtered.slice(0, 4);
  }, [packages, family]);

  if (columns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No {family} plans to compare yet.
      </div>
    );
  }

  const rows: { label: string; render: (p: PackageRow) => React.ReactNode }[] = [
    { label: 'Monthly price', render: (p) => <span className="font-semibold">৳{p.monthlyPrice}</span> },
    { label: 'Download', render: (p) => `${p.downloadMbps} Mbps` },
    { label: 'Upload', render: (p) => `${p.uploadMbps} Mbps` },
    {
      label: 'Data cap',
      render: (p) => (p.fupGB ? `${p.fupGB} GB` : 'Unlimited'),
    },
    { label: 'Setup fee', render: (p) => (p.setupFee ? `৳${p.setupFee}` : 'Free') },
    {
      label: 'Headline feature',
      render: (p) => p.features?.[0] ?? <span className="text-slate-400">—</span>,
    },
    {
      label: 'Ideal for',
      render: (p) =>
        p.tagline ?? (
          <span className="text-slate-400">
            {p.category === 'gaming' ? 'Low-latency sessions' : p.category === 'corporate' ? 'Office teams' : 'Home users'}
          </span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Compare plans side-by-side</h3>
          <p className="text-sm text-slate-500">
            Switch family to see the top {family === 'corporate' ? 'office' : family} plans.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm">
          {(['personal', 'gaming', 'corporate'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFamily(f)}
              className={`rounded-full px-3 py-1 font-medium capitalize transition ${
                family === f ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Feature
              </th>
              {columns.map((p) => (
                <th key={p._id} className="px-4 py-3 text-left">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  {p.isFeatured && (
                    <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      Popular
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-3 font-medium text-slate-600">{row.label}</td>
                {columns.map((p) => (
                  <td key={p._id} className="px-4 py-3 text-slate-800">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3"></td>
              {columns.map((p) => (
                <td key={p._id} className="px-4 py-3">
                  <Link
                    href={`/contact?packageInterest=${p._id}`}
                    className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Choose {p.name}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
