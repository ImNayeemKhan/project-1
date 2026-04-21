'use client';

import useSWR from 'swr';

interface Check {
  name: string;
  status: 'up' | 'degraded' | 'down' | 'skipped';
  detail?: string;
  latencyMs?: number;
}

interface HealthResponse {
  overall: 'up' | 'degraded' | 'down';
  checks: Check[];
  timestamp: string;
}

export default function HealthPage() {
  const { data, isLoading } = useSWR<HealthResponse>('/api/admin/health', {
    refreshInterval: 15_000,
  });

  const tone = (s: Check['status']) =>
    s === 'up'
      ? 'bg-emerald-100 text-emerald-700'
      : s === 'degraded'
      ? 'bg-amber-100 text-amber-700'
      : s === 'skipped'
      ? 'bg-slate-100 text-slate-600'
      : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Health</h1>

      <div className="card flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Overall status</div>
          <div
            className={
              data?.overall === 'up'
                ? 'text-3xl font-bold text-emerald-600'
                : data?.overall === 'degraded'
                ? 'text-3xl font-bold text-amber-600'
                : data?.overall === 'down'
                ? 'text-3xl font-bold text-red-600'
                : 'text-3xl font-bold text-slate-400'
            }
          >
            {isLoading ? '…' : data?.overall?.toUpperCase() ?? '—'}
          </div>
        </div>
        {data?.timestamp && (
          <div className="text-xs text-slate-400">
            Checked {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.checks?.map((c) => (
          <div key={c.name} className="card flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">{c.name}</div>
              {c.detail && <div className="mt-1 text-xs text-slate-500">{c.detail}</div>}
              {typeof c.latencyMs === 'number' && (
                <div className="mt-1 text-xs text-slate-400">{c.latencyMs} ms</div>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone(c.status)}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
