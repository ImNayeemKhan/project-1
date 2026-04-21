'use client';

import { useState } from 'react';
import useSWR from 'swr';

interface LogRow {
  _id: string;
  action: string;
  actor?: { _id: string; name?: string; email?: string; role?: string } | null;
  actorRole?: string;
  target?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

interface Resp {
  items: LogRow[];
  actions: string[];
}

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [target, setTarget] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const qs = new URLSearchParams();
  if (action) qs.set('action', action);
  if (target) qs.set('target', target);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  qs.set('limit', '200');

  const { data, isLoading } = useSWR<Resp>(`/api/admin/audit-log?${qs.toString()}`);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
      <div className="card grid gap-3 sm:grid-cols-4">
        <label className="text-sm">
          <span className="text-slate-500">Action</span>
          <select
            className="input mt-1"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">All</option>
            {data?.actions?.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-500">Target contains</span>
          <input
            className="input mt-1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="invoice-no / id"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-500">From</span>
          <input
            type="date"
            className="input mt-1"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-500">To</span>
          <input
            type="date"
            className="input mt-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Time</th>
              <th className="table-th">Actor</th>
              <th className="table-th">Action</th>
              <th className="table-th">Target</th>
              <th className="table-th">IP</th>
              <th className="table-th">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td className="table-td" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {data?.items?.length === 0 && (
              <tr>
                <td className="table-td text-slate-500" colSpan={6}>
                  No entries match those filters.
                </td>
              </tr>
            )}
            {data?.items?.map((row) => (
              <tr key={row._id}>
                <td className="table-td whitespace-nowrap text-xs text-slate-600">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="table-td">
                  {row.actor ? (
                    <span>
                      {row.actor.name ?? row.actor.email}{' '}
                      <span className="text-xs text-slate-400">({row.actor.role})</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">system</span>
                  )}
                </td>
                <td className="table-td font-mono text-xs">{row.action}</td>
                <td className="table-td font-mono text-xs text-slate-500">{row.target ?? '—'}</td>
                <td className="table-td font-mono text-xs text-slate-500">{row.ip ?? '—'}</td>
                <td className="table-td text-xs">
                  {row.meta ? (
                    <details>
                      <summary className="cursor-pointer text-brand-600">view</summary>
                      <pre className="mt-1 max-w-xs overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-700">
                        {JSON.stringify(row.meta, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
