'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Flag {
  _id: string;
  key: string;
  description?: string;
  enabled: boolean;
  rolloutPercent?: number;
  audience?: 'all' | 'admins' | 'customers' | 'resellers';
}

const defaultFlag: Omit<Flag, '_id'> = {
  key: '',
  description: '',
  enabled: false,
  rolloutPercent: 100,
  audience: 'all',
};

export default function FeatureFlagsPage() {
  const { data, isLoading } = useSWR<{ items: Flag[] }>('/api/admin/feature-flags');
  const [draft, setDraft] = useState<Omit<Flag, '_id'>>(defaultFlag);
  const [err, setErr] = useState<string | null>(null);

  const save = async (payload: Omit<Flag, '_id'>) => {
    setErr(null);
    try {
      await api.post('/api/admin/feature-flags', payload);
      setDraft(defaultFlag);
      mutate('/api/admin/feature-flags');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const toggle = (f: Flag) => save({ ...f, enabled: !f.enabled });
  const del = async (key: string) => {
    if (!confirm(`Delete flag "${key}"?`)) return;
    await api.delete(`/api/admin/feature-flags/${key}`);
    mutate('/api/admin/feature-flags');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Feature flags</h1>

      <div className="card">
        <div className="text-sm font-semibold text-slate-900">Add / update flag</div>
        <p className="text-xs text-slate-500">
          Ship code behind a flag, enable for a percentage of users, then flip to 100% once stable.
        </p>
        {err && <div className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save(draft);
          }}
        >
          <label className="text-sm">
            <span className="text-slate-500">Key</span>
            <input
              className="input mt-1"
              value={draft.key}
              onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              placeholder="e.g. customer.new_usage_graph"
              required
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">Audience</span>
            <select
              className="input mt-1"
              value={draft.audience}
              onChange={(e) =>
                setDraft({ ...draft, audience: e.target.value as Flag['audience'] })
              }
            >
              <option value="all">Everyone</option>
              <option value="admins">Admins</option>
              <option value="resellers">Resellers</option>
              <option value="customers">Customers</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-slate-500">Description</span>
            <input
              className="input mt-1"
              value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Who this is for / what it gates"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">Rollout %</span>
            <input
              type="number"
              min={0}
              max={100}
              className="input mt-1"
              value={draft.rolloutPercent ?? 100}
              onChange={(e) =>
                setDraft({ ...draft, rolloutPercent: Number(e.target.value) })
              }
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Key</th>
              <th className="table-th">Enabled</th>
              <th className="table-th">Rollout</th>
              <th className="table-th">Audience</th>
              <th className="table-th">Description</th>
              <th className="table-th"></th>
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
            {data?.items?.map((f) => (
              <tr key={f._id}>
                <td className="table-td font-mono text-xs">{f.key}</td>
                <td className="table-td">
                  <button
                    onClick={() => toggle(f)}
                    className={
                      f.enabled
                        ? 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700'
                        : 'rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600'
                    }
                  >
                    {f.enabled ? 'on' : 'off'}
                  </button>
                </td>
                <td className="table-td">{f.rolloutPercent ?? 100}%</td>
                <td className="table-td">{f.audience ?? 'all'}</td>
                <td className="table-td text-slate-600">{f.description ?? '—'}</td>
                <td className="table-td">
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => del(f.key)}
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
