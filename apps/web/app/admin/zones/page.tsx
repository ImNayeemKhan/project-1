'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Zone {
  _id: string;
  name: string;
  code: string;
  city?: string;
  description?: string;
  coverageNote?: string;
  isActive: boolean;
}

export default function AdminZonesPage() {
  const { data, isLoading } = useSWR<{ items: Zone[] }>('/api/admin/zones');
  const [form, setForm] = useState({ name: '', code: '', city: 'Dhaka', description: '', coverageNote: '' });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/api/admin/zones', form);
      setForm({ name: '', code: '', city: 'Dhaka', description: '', coverageNote: '' });
      mutate('/api/admin/zones');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const toggle = async (z: Zone) => {
    try {
      await api.patch(`/api/admin/zones/${z._id}`, { isActive: !z.isActive });
      mutate('/api/admin/zones');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Service zones</h1>
      <form onSubmit={submit} className="card grid grid-cols-1 gap-3 sm:grid-cols-5">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-primary">Add zone</button>
        {err && <div className="col-span-5 text-sm text-red-600">{err}</div>}
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Code</th>
              <th className="table-th">City</th>
              <th className="table-th">Description</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={6}>Loading…</td></tr>}
            {data?.items?.map((z) => (
              <tr key={z._id}>
                <td className="table-td font-medium">{z.name}</td>
                <td className="table-td font-mono text-xs">{z.code}</td>
                <td className="table-td">{z.city ?? '—'}</td>
                <td className="table-td">{z.description ?? '—'}</td>
                <td className="table-td"><span className={z.isActive ? 'badge-green' : 'badge-slate'}>{z.isActive ? 'Active' : 'Disabled'}</span></td>
                <td className="table-td">
                  <button onClick={() => toggle(z)} className="text-xs text-brand-600 hover:underline">
                    {z.isActive ? 'Disable' : 'Enable'}
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
