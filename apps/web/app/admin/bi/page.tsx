'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { Sparkline, BarChart, Donut } from '@/components/charts/MiniChart';

interface BIOverview {
  kpis: {
    mrr: number;
    arr: number;
    arpu: number;
    churnRate: number;
    collectionEfficiency: number;
  };
  revenue: {
    monthly: { month: string; total: number }[];
    daily: { date: string; total: number; count: number }[];
  };
  ar: {
    aging: { bucket: string; count: number; total: number }[];
    failedPayments: { _id: string; count: number; total: number }[];
  };
  mix: {
    byPackage: { packageId: string; packageName: string; category: string; subs: number; revenue: number }[];
    byCategory: { category: string; subs: number; revenue: number }[];
  };
  zones: { zoneId: string; zoneName: string; subs: number; revenue: number; openTickets: number }[];
  noc: { activeSubs: number; suspendedSubs: number; openTickets: number; packagesCount: number };
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(n);
}

const CAT_COLORS: Record<string, string> = {
  personal: '#0ea5e9',
  gaming: '#8b5cf6',
  corporate: '#f59e0b',
};

export default function BIDashboard() {
  const { data, error, isLoading } = useSWR<BIOverview>('/api/admin/bi/overview', {
    refreshInterval: 60_000,
  });

  const monthlyTrend = useMemo(() => data?.revenue.monthly.map((m) => m.total) ?? [], [data]);
  const dailyTrend = useMemo(() => data?.revenue.daily.map((d) => d.total) ?? [], [data]);
  const mom = useMemo(() => {
    const m = data?.revenue.monthly ?? [];
    if (m.length < 2) return 0;
    const prev = m[m.length - 2].total;
    const cur = m[m.length - 1].total;
    if (prev === 0) return cur > 0 ? 100 : 0;
    return +(((cur - prev) / prev) * 100).toFixed(1);
  }, [data]);

  if (error) return <div className="text-red-600">Failed to load dashboard.</div>;
  if (isLoading || !data) return <div className="text-slate-500">Loading business intelligence…</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Business intelligence</h1>
          <p className="text-sm text-slate-500">Live KPIs refreshed every minute.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/bi/export/revenue.csv" className="btn-secondary">Revenue CSV</a>
          <a href="/api/admin/bi/export/aging.csv" className="btn-secondary">Aging CSV</a>
          <a href="/api/admin/bi/export/mix.csv" className="btn-secondary">Mix CSV</a>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="MRR"
          value={`৳${fmt(data.kpis.mrr)}`}
          sub={`ARR ৳${fmt(data.kpis.arr)}`}
          trend={monthlyTrend}
        />
        <KpiCard
          label="ARPU"
          value={`৳${fmt(data.kpis.arpu)}`}
          sub="per active sub / month"
          trend={dailyTrend}
        />
        <KpiCard
          label="MoM growth"
          value={`${mom > 0 ? '+' : ''}${mom}%`}
          sub="vs previous month"
          tone={mom >= 0 ? 'green' : 'red'}
          trend={monthlyTrend}
        />
        <KpiCard
          label="Churn rate"
          value={`${data.kpis.churnRate}%`}
          sub="subs cancelled this month"
          tone={data.kpis.churnRate > 5 ? 'red' : 'green'}
        />
        <KpiCard
          label="Collection efficiency"
          value={`${data.kpis.collectionEfficiency}%`}
          sub="paid / invoiced this month"
          tone={data.kpis.collectionEfficiency >= 85 ? 'green' : 'yellow'}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Monthly revenue — 12 months</h2>
            <span className="text-xs text-slate-500">৳ BDT</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <BarChart
              labels={data.revenue.monthly.map((m) => m.month)}
              values={data.revenue.monthly.map((m) => m.total)}
              color="#0ea5e9"
              width={520}
            />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Daily revenue — last 30 days</h2>
            <span className="text-xs text-slate-500">৳ BDT</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <BarChart
              labels={data.revenue.daily.map((d) => d.date)}
              values={data.revenue.daily.map((d) => d.total)}
              color="#22c55e"
              width={520}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Package category mix</h2>
          <div className="mt-4">
            <Donut
              items={data.mix.byCategory.map((c) => ({
                label: c.category,
                value: c.revenue,
                color: CAT_COLORS[c.category] ?? '#64748b',
              }))}
            />
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Revenue by package</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 text-left">Package</th>
                  <th className="py-2 text-left">Category</th>
                  <th className="py-2 text-right">Subs</th>
                  <th className="py-2 text-right">Monthly revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.mix.byPackage.map((p) => (
                  <tr key={p.packageId} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{p.packageName}</td>
                    <td className="py-2 capitalize text-slate-600">{p.category}</td>
                    <td className="py-2 text-right font-medium">{p.subs}</td>
                    <td className="py-2 text-right font-medium">৳{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900">Accounts receivable aging</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {data.ar.aging.map((b) => (
              <div key={b.bucket} className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs uppercase text-slate-500">{b.bucket} d</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">৳{fmt(b.total)}</div>
                <div className="text-xs text-slate-500">{b.count} invoice{b.count === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Failed payments — last 30 days</h3>
            {data.ar.failedPayments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">None. All collection runs clean.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {data.ar.failedPayments.map((f) => (
                  <li key={f._id} className="flex items-center justify-between">
                    <span className="capitalize text-slate-700">{f._id}</span>
                    <span className="text-slate-900">
                      {f.count} × ৳{fmt(f.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Zone performance</h2>
            <a href="/api/admin/bi/export/zones.csv" className="text-xs text-brand-600 hover:underline">
              Export CSV
            </a>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 text-left">Zone</th>
                  <th className="py-2 text-right">Active subs</th>
                  <th className="py-2 text-right">MRR</th>
                  <th className="py-2 text-right">Open tickets</th>
                </tr>
              </thead>
              <tbody>
                {data.zones.map((z) => (
                  <tr key={z.zoneId || z.zoneName} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{z.zoneName}</td>
                    <td className="py-2 text-right">{z.subs}</td>
                    <td className="py-2 text-right">৳{fmt(z.revenue)}</td>
                    <td className="py-2 text-right">
                      {z.openTickets > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                          {z.openTickets}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Network operations</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NocBox label="Active subs" value={data.noc.activeSubs} tone="green" />
          <NocBox label="Suspended" value={data.noc.suspendedSubs} tone="red" />
          <NocBox label="Open tickets" value={data.noc.openTickets} tone="yellow" />
          <NocBox label="Active packages" value={data.noc.packagesCount} tone="slate" />
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  tone = 'slate',
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number[];
  tone?: 'green' | 'red' | 'yellow' | 'slate';
}) {
  const toneMap = {
    green: 'text-green-700',
    red: 'text-red-700',
    yellow: 'text-amber-700',
    slate: 'text-slate-900',
  };
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneMap[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
      {trend && trend.length > 1 && (
        <div className="mt-3">
          <Sparkline points={trend} />
        </div>
      )}
    </div>
  );
}

function NocBox({ label, value, tone }: { label: string; value: number; tone: 'green' | 'red' | 'yellow' | 'slate' }) {
  const toneMap = {
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-700',
  };
  return (
    <div className={`rounded-lg p-4 ${toneMap[tone]}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
