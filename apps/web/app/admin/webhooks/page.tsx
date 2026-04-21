'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Webhook {
  _id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastStatus?: number;
  failureCount: number;
  lastDeliveryAt?: string;
  createdAt: string;
}

interface Delivery {
  _id: string;
  event: string;
  status: 'pending' | 'success' | 'failed';
  httpStatus?: number;
  attempts: number;
  lastError?: string;
  deliveredAt?: string;
  createdAt: string;
}

export default function AdminWebhooksPage() {
  const { data, isLoading } = useSWR<{ items: Webhook[]; events: string[] }>(
    '/api/admin/webhooks'
  );
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], isActive: true });
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [shownSecret, setShownSecret] = useState<Record<string, boolean>>({});

  const events = data?.events ?? [];

  const toggleEvent = (ev: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((x) => x !== ev) : [...f.events, ev],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (form.events.length === 0) {
      setErr('Select at least one event');
      return;
    }
    try {
      await api.post('/api/admin/webhooks', form);
      setForm({ name: '', url: '', events: [], isActive: true });
      mutate('/api/admin/webhooks');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const toggle = async (w: Webhook) => {
    try {
      await api.patch(`/api/admin/webhooks/${w._id}`, { isActive: !w.isActive });
      mutate('/api/admin/webhooks');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const rotate = async (w: Webhook) => {
    if (!confirm(`Rotate secret for "${w.name}"? Receivers will need the new secret to verify signatures.`)) return;
    try {
      await api.post(`/api/admin/webhooks/${w._id}/rotate-secret`);
      mutate('/api/admin/webhooks');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const remove = async (w: Webhook) => {
    if (!confirm(`Delete webhook "${w.name}"? Historical deliveries are preserved.`)) return;
    try {
      await api.delete(`/api/admin/webhooks/${w._id}`);
      mutate('/api/admin/webhooks');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Webhooks</h1>
        <p className="text-sm text-slate-500">
          Push platform events to external systems. Payloads are signed with{' '}
          <code className="rounded bg-slate-100 px-1 text-xs">HMAC-SHA256</code> in the{' '}
          <code className="rounded bg-slate-100 px-1 text-xs">X-Webhook-Signature</code> header.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Name (e.g. Accounting integration)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input"
            type="url"
            placeholder="https://example.com/hooks/desh"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Events
          </div>
          <div className="flex flex-wrap gap-2">
            {events.map((ev) => (
              <label
                key={ev}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                  form.events.includes(ev)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.events.includes(ev)}
                  onChange={() => toggleEvent(ev)}
                />
                {ev}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <button className="btn-primary">Create webhook</button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name / URL</th>
              <th className="table-th">Events</th>
              <th className="table-th">Last status</th>
              <th className="table-th">Failures</th>
              <th className="table-th">State</th>
              <th className="table-th">Actions</th>
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
            {!isLoading && data?.items?.length === 0 && (
              <tr>
                <td className="table-td text-slate-500" colSpan={6}>
                  No webhooks registered. Add one above.
                </td>
              </tr>
            )}
            {data?.items?.map((w) => (
              <tr key={w._id} className="align-top">
                <td className="table-td">
                  <div className="font-medium text-slate-900">{w.name}</div>
                  <div className="text-xs text-slate-500">{w.url}</div>
                  <div className="mt-1 text-xs">
                    <span className="text-slate-400">Secret: </span>
                    <code className="font-mono">
                      {shownSecret[w._id] ? w.secret : w.secret.slice(0, 8) + '…'}
                    </code>
                    <button
                      type="button"
                      className="ml-2 text-brand-600 hover:underline"
                      onClick={() =>
                        setShownSecret((s) => ({ ...s, [w._id]: !s[w._id] }))
                      }
                    >
                      {shownSecret[w._id] ? 'hide' : 'show'}
                    </button>
                  </div>
                </td>
                <td className="table-td">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {w.events.map((ev) => (
                      <span
                        key={ev}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="table-td text-xs">
                  {w.lastStatus ? (
                    <span
                      className={
                        w.lastStatus >= 200 && w.lastStatus < 300
                          ? 'badge-green'
                          : 'badge-red'
                      }
                    >
                      HTTP {w.lastStatus}
                    </span>
                  ) : (
                    <span className="text-slate-400">never</span>
                  )}
                  {w.lastDeliveryAt && (
                    <div className="mt-1 text-slate-500">
                      {new Date(w.lastDeliveryAt).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="table-td">
                  {w.failureCount > 0 ? (
                    <span className="badge-red">{w.failureCount}</span>
                  ) : (
                    <span className="badge-green">0</span>
                  )}
                </td>
                <td className="table-td">
                  <span className={w.isActive ? 'badge-green' : 'badge-slate'}>
                    {w.isActive ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="table-td space-x-3 text-xs">
                  <button onClick={() => toggle(w)} className="text-brand-600 hover:underline">
                    {w.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={() => rotate(w)} className="text-amber-600 hover:underline">
                    Rotate
                  </button>
                  <button
                    onClick={() => setOpenId(openId === w._id ? null : w._id)}
                    className="text-slate-600 hover:underline"
                  >
                    {openId === w._id ? 'Hide deliveries' : 'Deliveries'}
                  </button>
                  <button onClick={() => remove(w)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openId && <DeliveryList id={openId} />}
    </div>
  );
}

function DeliveryList({ id }: { id: string }) {
  const { data, isLoading } = useSWR<{ items: Delivery[] }>(
    `/api/admin/webhooks/${id}/deliveries`,
    { refreshInterval: 15_000 }
  );
  return (
    <div className="card overflow-x-auto p-0">
      <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
        Recent deliveries (auto-refresh 15s)
      </div>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="table-th">When</th>
            <th className="table-th">Event</th>
            <th className="table-th">Status</th>
            <th className="table-th">HTTP</th>
            <th className="table-th">Attempts</th>
            <th className="table-th">Error</th>
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
          {!isLoading && data?.items?.length === 0 && (
            <tr>
              <td className="table-td text-slate-500" colSpan={6}>
                No deliveries yet. This hook fires as real events happen.
              </td>
            </tr>
          )}
          {data?.items?.map((d) => (
            <tr key={d._id}>
              <td className="table-td text-xs text-slate-500">
                {new Date(d.deliveredAt ?? d.createdAt).toLocaleString()}
              </td>
              <td className="table-td font-mono text-xs">{d.event}</td>
              <td className="table-td">
                <span
                  className={
                    d.status === 'success'
                      ? 'badge-green'
                      : d.status === 'failed'
                        ? 'badge-red'
                        : 'badge-slate'
                  }
                >
                  {d.status}
                </span>
              </td>
              <td className="table-td text-xs">{d.httpStatus ?? '—'}</td>
              <td className="table-td text-xs">{d.attempts}</td>
              <td className="table-td text-xs text-red-600">{d.lastError ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
