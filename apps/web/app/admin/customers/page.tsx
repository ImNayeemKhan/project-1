'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'reseller' | 'customer';
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useSWR<{ items: User[]; total: number }>(
    `/api/admin/users?role=customer&q=${encodeURIComponent(q)}`
  );

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState<string | null>(null);

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/api/admin/users', { ...form, role: 'customer' });
      setForm({ name: '', email: '', phone: '', password: '' });
      mutate((key: any) => typeof key === 'string' && key.startsWith('/api/admin/users'));
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <input
          className="input max-w-xs"
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <form onSubmit={createCustomer} className="card grid grid-cols-1 gap-3 sm:grid-cols-5">
        <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" type="password" placeholder="Initial password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <button className="btn-primary">Create</button>
        {err && <div className="col-span-5 text-sm text-red-600">{err}</div>}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Status</th>
              <th className="table-th">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td className="table-td" colSpan={5}>Loading…</td></tr>
            )}
            {data?.items?.length === 0 && (
              <tr><td className="table-td" colSpan={5}>No customers yet.</td></tr>
            )}
            {data?.items?.map((u) => (
              <tr key={u._id}>
                <td className="table-td font-medium text-slate-900">{u.name}</td>
                <td className="table-td">{u.email}</td>
                <td className="table-td">{u.phone ?? '—'}</td>
                <td className="table-td">
                  <span className={u.isActive ? 'badge-green' : 'badge-slate'}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="table-td">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
