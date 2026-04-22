'use client';

import useSWR from 'swr';

interface Me {
  subscriptions: Array<{ _id: string; pppoeUsername: string; package: { name: string } }>;
}

interface UsageResponse {
  series: { date: string; downloadMB: number; uploadMB: number }[];
  fupGB: number | null;
  totalUsedGB: number;
}

export default function UsagePage() {
  const { data: me } = useSWR<Me>('/api/customer/me');
  const sub = me?.subscriptions[0];
  const { data } = useSWR<UsageResponse>(
    sub ? `/api/customer/subscriptions/${sub._id}/usage` : null
  );

  if (!me) return <div>Loading…</div>;
  if (!sub) return <div className="card text-slate-500">No subscription to show usage for.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Usage & FUP</h1>
      <div className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">Last 30 days on {sub.package.name}</div>
            <div className="text-3xl font-bold text-slate-900">
              {data ? `${data.totalUsedGB.toFixed(1)} GB` : '—'}
            </div>
          </div>
          {data?.fupGB && (
            <div className="text-right text-sm">
              <div className="text-slate-500">Data cap</div>
              <div className="font-semibold">{data.fupGB} GB</div>
            </div>
          )}
        </div>
        {data?.fupGB && (
          <FupBar usedGB={data.totalUsedGB} fupGB={data.fupGB} />
        )}
      </div>
      <div className="card">
        <div className="mb-3 text-sm font-semibold text-slate-900">Daily traffic</div>
        {data?.series?.length ? (
          <UsageChart series={data.series} />
        ) : (
          <p className="text-sm text-slate-500">
            Not enough data yet. Usage samples sync from the router once daily.
          </p>
        )}
      </div>
    </div>
  );
}

function FupBar({ usedGB, fupGB }: { usedGB: number; fupGB: number }) {
  const pct = Math.min(100, (usedGB / fupGB) * 100);
  const color = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="mt-4">
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{pct.toFixed(0)}% used</span>
        <span>{Math.max(0, fupGB - usedGB).toFixed(1)} GB remaining</span>
      </div>
    </div>
  );
}

function UsageChart({ series }: { series: { date: string; downloadMB: number; uploadMB: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.downloadMB + d.uploadMB));
  return (
    <div className="flex h-48 items-end gap-1">
      {series.map((d) => {
        const total = d.downloadMB + d.uploadMB;
        const dlH = (d.downloadMB / max) * 100;
        const upH = (d.uploadMB / max) * 100;
        return (
          <div
            key={d.date}
            className="group relative flex flex-1 flex-col justify-end"
            title={`${new Date(d.date).toDateString()}: ${(total / 1024).toFixed(2)} GB`}
          >
            <div className="w-full bg-indigo-400" style={{ height: `${upH}%` }} />
            <div className="w-full bg-brand-600" style={{ height: `${dlH}%` }} />
          </div>
        );
      })}
    </div>
  );
}
