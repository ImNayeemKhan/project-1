'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Sub {
  _id: string;
  pppoeUsername: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  customer: { _id: string; name: string; email: string };
  package: { _id: string; name: string; code: string; monthlyPrice: number };
  router?: { _id: string; name: string } | null;
  nextBillingDate: string;
}

export default function SubscriptionsPage() {
  const { data, isLoading } = useSWR<{ items: Sub[] }>('/api/admin/subscriptions');
  const { data: customers } = useSWR<{ items: { _id: string; name: string; email: string }[] }>('/api/admin/users?role=customer&limit=100');
  const { data: packages } = useSWR<{ items: { _id: string; name: string; code: string }[] }>('/api/admin/packages');
  const { data: routers } = useSWR<{ items: { _id: string; name: string }[] }>('/api/admin/routers');

  const [form, setForm] = useState({
    customerId: '',
    packageId: '',
    routerId: '',
    pppoeUsername: '',
    pppoePassword: '',
  });
  const [err, setErr] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/api/admin/subscriptions', {
        ...form,
        routerId: form.routerId || undefined,
      });
      setForm({ customerId: '', packageId: '', routerId: '', pppoeUsername: '', pppoePassword: '' });
      mutate('/api/admin/subscriptions');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const doAction = async (id: string, action: 'suspend' | 'resume' | 'cancel') => {
    try {
      await api.post(`/api/admin/subscriptions/${id}/action`, { action });
      mutate('/api/admin/subscriptions');
    } catch (e) {
      alert(extractError(e));
    }
  };

  const tone = (s: Sub['status']) => (
    s === 'active' ? 'badge-green' : s === 'suspended' ? 'badge-red' : s === 'pending' ? 'badge-yellow' : 'badge-slate'
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Subscriptions</h1>

      <form onSubmit={create} className="card grid grid-cols-1 gap-3 sm:grid-cols-6">
        <select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
          <option value="">Select customer</option>
          {customers?.items?.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
        </select>
        <select className="input" value={form.packageId} onChange={(e) => setForm({ ...form, packageId: e.target.value })} required>
          <option value="">Select package</option>
          {packages?.items?.map((p) => <option key={p._id} value={p._id}>{p.name} [{p.code}]</option>)}
        </select>
        <select className="input" value={form.routerId} onChange={(e) => setForm({ ...form, routerId: e.target.value })}>
          <option value="">Router (optional)</option>
          {routers?.items?.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <input className="input" placeholder="PPPoE username" value={form.pppoeUsername} onChange={(e) => setForm({ ...form, pppoeUsername: e.target.value })} required />
        <input className="input" placeholder="PPPoE password" value={form.pppoePassword} onChange={(e) => setForm({ ...form, pppoePassword: e.target.value })} required />
        <button className="btn-primary">Provision</button>
        {err && <div className="col-span-6 text-sm text-red-600">{err}</div>}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Customer</th>
              <th className="table-th">Package</th>
              <th className="table-th">PPPoE</th>
              <th className="table-th">Router</th>
              <th className="table-th">Next billing</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={7}>Loading…</td></tr>}
            {data?.items?.map((s) => (
              <tr key={s._id}>
                <td className="table-td">{s.customer?.name} <span className="text-slate-400">{s.customer?.email}</span></td>
                <td className="table-td">{s.package?.name} <span className="text-slate-400">৳{s.package?.monthlyPrice}</span></td>
                <td className="table-td font-mono text-xs">{s.pppoeUsername}</td>
                <td className="table-td">{s.router?.name ?? '—'}</td>
                <td className="table-td">{new Date(s.nextBillingDate).toLocaleDateString()}</td>
                <td className="table-td"><span className={tone(s.status)}>{s.status}</span></td>
                <td className="table-td space-x-1">
                  {s.status === 'active' && (
                    <button className="text-xs text-red-600 hover:underline" onClick={() => doAction(s._id, 'suspend')}>Suspend</button>
                  )}
                  {s.status === 'suspended' && (
                    <button className="text-xs text-green-700 hover:underline" onClick={() => doAction(s._id, 'resume')}>Resume</button>
                  )}
                  {s.status !== 'cancelled' && (
                    <button className="text-xs text-slate-500 hover:underline" onClick={() => doAction(s._id, 'cancel')}>Cancel</button>
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
