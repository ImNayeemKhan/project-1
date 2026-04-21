'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface PackageRow {
  _id: string;
  name: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  category?: 'personal' | 'gaming' | 'corporate' | string;
  downloadMbps: number;
  uploadMbps: number;
  monthlyPrice: number;
  setupFee: number;
  fupGB?: number;
  features: string[];
  isFeatured?: boolean;
}

type Family = 'all' | 'personal' | 'gaming' | 'corporate';
type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'speed-desc';

const FAMILIES: { key: Family; label: string }[] = [
  { key: 'all', label: 'All plans' },
  { key: 'personal', label: 'Personal' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'corporate', label: 'Corporate' },
];

export function PackageFilterGrid({ packages }: { packages: PackageRow[] }) {
  const [family, setFamily] = useState<Family>('all');
  const [minSpeed, setMinSpeed] = useState(0);
  const [sort, setSort] = useState<SortKey>('popular');

  const maxSpeed = useMemo(
    () => packages.reduce((m, p) => Math.max(m, p.downloadMbps), 0),
    [packages]
  );

  const filtered = useMemo(() => {
    let items = packages.slice();
    if (family !== 'all') {
      items = items.filter((p) => (p.category ?? 'personal') === family);
    }
    if (minSpeed > 0) {
      items = items.filter((p) => p.downloadMbps >= minSpeed);
    }
    switch (sort) {
      case 'price-asc':
        items.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        break;
      case 'price-desc':
        items.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
        break;
      case 'speed-desc':
        items.sort((a, b) => b.downloadMbps - a.downloadMbps);
        break;
      default:
        items.sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
    }
    return items;
  }, [packages, family, minSpeed, sort]);

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {FAMILIES.map((f) => {
            const count =
              f.key === 'all'
                ? packages.length
                : packages.filter((p) => (p.category ?? 'personal') === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFamily(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  family === f.key
                    ? 'bg-brand-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <label htmlFor="sort" className="text-slate-500">Sort</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input !w-auto !py-1.5"
            >
              <option value="popular">Popular first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="speed-desc">Fastest first</option>
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[auto_1fr_auto]">
          <label htmlFor="speed" className="text-sm font-medium text-slate-700">
            Minimum download
          </label>
          <input
            id="speed"
            type="range"
            min={0}
            max={Math.max(200, maxSpeed)}
            step={5}
            value={minSpeed}
            onChange={(e) => setMinSpeed(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <span className="font-mono text-sm text-slate-800">
            {minSpeed > 0 ? `${minSpeed}+ Mbps` : 'any speed'}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No plans match these filters. Try lowering the minimum speed or switching family.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pkg) => (
            <article
              key={pkg._id}
              className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${
                pkg.isFeatured ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-slate-200'
              }`}
            >
              {pkg.isFeatured && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                  Popular
                </span>
              )}
              {pkg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pkg.imageUrl}
                  alt={pkg.name}
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                  {pkg.category && (
                    <span className="badge-slate capitalize">{pkg.category}</span>
                  )}
                </div>
                {pkg.tagline && <p className="mt-1 text-sm text-slate-600">{pkg.tagline}</p>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {pkg.monthlyPrice > 0 ? `৳${pkg.monthlyPrice.toLocaleString()}` : 'Call'}
                  </span>
                  {pkg.monthlyPrice > 0 && <span className="text-sm text-slate-500">/ month</span>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-slate-500">Download</dt>
                  <dd className="text-right font-medium text-slate-800">{pkg.downloadMbps} Mbps</dd>
                  <dt className="text-slate-500">Upload</dt>
                  <dd className="text-right font-medium text-slate-800">{pkg.uploadMbps} Mbps</dd>
                  <dt className="text-slate-500">Setup</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {pkg.setupFee > 0 ? `৳${pkg.setupFee}` : 'Free'}
                  </dd>
                </dl>
                {pkg.features?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {pkg.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 text-brand-600">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-5">
                  <Link
                    href={`/contact?plan=${pkg._id}`}
                    className="btn-primary w-full justify-center"
                  >
                    Get {pkg.name}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
