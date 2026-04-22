'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Rtr {
  _id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  tls: boolean;
  isActive: boolean;
  lastSeenAt?: string;
}

export default function RoutersPage() {
  const { data, isLoading } = useSWR<{ items: Rtr[] }>('/api/admin/routers');
  const [form, setForm] = useState({ name: '', host: '', port: 8728, username: 'api', password: '', tls: false });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/api/admin/routers', form);
      setForm({ name: '', host: '', port: 8728, username: 'api', password: '', tls: false });
      mutate('/api/admin/routers');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const ping = async (id: string) => {
    try {
      const { data } = await api.post(`/api/admin/routers/${id}/ping`);
      alert(data.ok ? `Connected — ${data.sessions} active session(s)` : `Failed: ${data.error}`);
      mutate('/api/admin/routers');
    } catch (e) {
      alert(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Routers (MikroTik)</h1>

      <form onSubmit={submit} className="card grid grid-cols-1 gap-3 sm:grid-cols-7">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Host/IP" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
        <input className="input" type="number" placeholder="Port" value={form.port} onChange={(e) => setForm({ ...form, port: +e.target.value })} />
        <input className="input" placeholder="API user" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input className="input" type="password" placeholder="API password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.tls} onChange={(e) => setForm({ ...form, tls: e.target.checked })} />
          TLS
        </label>
        <button className="btn-primary">Add router</button>
        {err && <div className="col-span-7 text-sm text-red-600">{err}</div>}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Host:Port</th>
              <th className="table-th">User</th>
              <th className="table-th">TLS</th>
              <th className="table-th">Last seen</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={6}>Loading…</td></tr>}
            {data?.items?.map((r) => (
              <tr key={r._id}>
                <td className="table-td font-medium">{r.name}</td>
                <td className="table-td font-mono text-xs">{r.host}:{r.port}</td>
                <td className="table-td">{r.username}</td>
                <td className="table-td">{r.tls ? 'Yes' : 'No'}</td>
                <td className="table-td">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString() : '—'}</td>
                <td className="table-td">
                  <button className="text-xs text-brand-600 hover:underline" onClick={() => ping(r._id)}>Test connection</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
