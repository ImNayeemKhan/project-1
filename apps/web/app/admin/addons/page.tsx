'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Addon {
  _id: string;
  name: string;
  code: string;
  category: string;
  monthlyPrice: number;
  setupFee: number;
  isActive: boolean;
}

const EMPTY = {
  name: '',
  code: '',
  category: 'other' as const,
  tagline: '',
  monthlyPrice: 0,
  setupFee: 0,
  features: '',
  imageUrl: '',
};

export default function AdminAddonsPage() {
  const { data, isLoading } = useSWR<{ items: Addon[] }>('/api/admin/addons');
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const payload = {
        ...form,
        monthlyPrice: Number(form.monthlyPrice),
        setupFee: Number(form.setupFee),
        features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
        imageUrl: form.imageUrl || undefined,
      };
      await api.post('/api/admin/addons', payload);
      setForm(EMPTY);
      mutate('/api/admin/addons');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const toggle = async (a: Addon) => {
    try {
      await api.patch(`/api/admin/addons/${a._id}`, { isActive: !a.isActive });
      mutate('/api/admin/addons');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Service add-ons</h1>

      <form onSubmit={submit} className="card grid grid-cols-1 gap-3 md:grid-cols-4">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}>
          <option value="ip">Static IP</option>
          <option value="iptv">IPTV</option>
          <option value="backup">Cloud backup</option>
          <option value="wifi">Managed Wi-Fi</option>
          <option value="security">Security</option>
          <option value="other">Other</option>
        </select>
        <input className="input" type="number" placeholder="Monthly price" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} required />
        <input className="input" type="number" placeholder="Setup fee" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: Number(e.target.value) })} />
        <input className="input md:col-span-3" placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Features (comma separated)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <button className="btn-primary">Add</button>
        {err && <div className="md:col-span-4 text-sm text-red-600">{err}</div>}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Code</th>
              <th className="table-th">Category</th>
              <th className="table-th">Monthly</th>
              <th className="table-th">Setup</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={7}>Loading…</td></tr>}
            {data?.items?.map((a) => (
              <tr key={a._id}>
                <td className="table-td font-medium">{a.name}</td>
                <td className="table-td font-mono text-xs">{a.code}</td>
                <td className="table-td capitalize">{a.category}</td>
                <td className="table-td">৳{a.monthlyPrice}</td>
                <td className="table-td">৳{a.setupFee}</td>
                <td className="table-td"><span className={a.isActive ? 'badge-green' : 'badge-slate'}>{a.isActive ? 'Active' : 'Disabled'}</span></td>
                <td className="table-td">
                  <button onClick={() => toggle(a)} className="text-xs text-brand-600 hover:underline">
                    {a.isActive ? 'Disable' : 'Enable'}
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
