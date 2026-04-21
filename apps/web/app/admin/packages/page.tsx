'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Pkg {
  _id: string;
  name: string;
  code: string;
  downloadMbps: number;
  uploadMbps: number;
  monthlyPrice: number;
  isActive: boolean;
}

export default function PackagesPage() {
  const { data, isLoading } = useSWR<{ items: Pkg[] }>('/api/admin/packages');
  const [form, setForm] = useState({ name: '', code: '', downloadMbps: 10, uploadMbps: 5, monthlyPrice: 500 });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/api/admin/packages', form);
      setForm({ name: '', code: '', downloadMbps: 10, uploadMbps: 5, monthlyPrice: 500 });
      mutate('/api/admin/packages');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Packages</h1>
      <form onSubmit={submit} className="card grid grid-cols-1 gap-3 sm:grid-cols-6">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <input className="input" type="number" placeholder="Down Mbps" value={form.downloadMbps} onChange={(e) => setForm({ ...form, downloadMbps: +e.target.value })} />
        <input className="input" type="number" placeholder="Up Mbps" value={form.uploadMbps} onChange={(e) => setForm({ ...form, uploadMbps: +e.target.value })} />
        <input className="input" type="number" placeholder="Monthly price" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: +e.target.value })} />
        <button className="btn-primary">Add</button>
        {err && <div className="col-span-6 text-sm text-red-600">{err}</div>}
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Code</th>
              <th className="table-th">Speed</th>
              <th className="table-th">Price</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={5}>Loading…</td></tr>}
            {data?.items?.map((p) => (
              <tr key={p._id}>
                <td className="table-td font-medium">{p.name}</td>
                <td className="table-td">{p.code}</td>
                <td className="table-td">{p.downloadMbps}/{p.uploadMbps} Mbps</td>
                <td className="table-td">৳ {p.monthlyPrice.toLocaleString()}</td>
                <td className="table-td">
                  <span className={p.isActive ? 'badge-green' : 'badge-slate'}>{p.isActive ? 'Active' : 'Disabled'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
