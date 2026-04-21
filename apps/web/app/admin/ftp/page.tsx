'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface FtpServer {
  _id: string;
  name: string;
  code: string;
  category: 'entertainment' | 'carrier' | 'business' | 'partnership';
  host: string;
  protocol: string;
  accessLevel: 'public' | 'customer' | 'business' | 'partner';
  capacityTB: number;
  maxSpeedMbps: number;
  isActive: boolean;
}

const EMPTY = {
  name: '',
  code: '',
  category: 'entertainment' as const,
  tagline: '',
  host: '',
  webUrl: '',
  port: 21,
  protocol: 'ftp' as const,
  accessLevel: 'customer' as const,
  capacityTB: 0,
  maxSpeedMbps: 1000,
  contentTypes: '',
  features: '',
  imageUrl: '',
};

export default function AdminFtpPage() {
  const { data, isLoading } = useSWR<{ items: FtpServer[] }>('/api/admin/ftp-servers');
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const payload = {
        ...form,
        port: Number(form.port),
        capacityTB: Number(form.capacityTB),
        maxSpeedMbps: Number(form.maxSpeedMbps),
        contentTypes: form.contentTypes.split(',').map((s) => s.trim()).filter(Boolean),
        features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
        webUrl: form.webUrl || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      await api.post('/api/admin/ftp-servers', payload);
      setForm(EMPTY);
      mutate('/api/admin/ftp-servers');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const toggle = async (s: FtpServer) => {
    try {
      await api.patch(`/api/admin/ftp-servers/${s._id}`, { isActive: !s.isActive });
      mutate('/api/admin/ftp-servers');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">FTP / BDIX servers</h1>

      <form onSubmit={submit} className="card grid grid-cols-1 gap-3 md:grid-cols-4">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}>
          <option value="entertainment">Entertainment</option>
          <option value="carrier">Carrier</option>
          <option value="business">Business</option>
          <option value="partnership">Partnership</option>
        </select>
        <select className="input" value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: e.target.value as typeof form.accessLevel })}>
          <option value="public">Public</option>
          <option value="customer">Customer</option>
          <option value="business">Business</option>
          <option value="partner">Partner</option>
        </select>
        <input className="input" placeholder="host.example.net" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
        <input className="input" placeholder="https://web.url" value={form.webUrl} onChange={(e) => setForm({ ...form, webUrl: e.target.value })} />
        <select className="input" value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value as typeof form.protocol })}>
          <option value="ftp">FTP</option>
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="smb">SMB</option>
        </select>
        <input className="input" type="number" placeholder="Port" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Capacity TB" value={form.capacityTB} onChange={(e) => setForm({ ...form, capacityTB: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Max speed Mbps" value={form.maxSpeedMbps} onChange={(e) => setForm({ ...form, maxSpeedMbps: Number(e.target.value) })} />
        <input className="input md:col-span-2" placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Content types (comma separated)" value={form.contentTypes} onChange={(e) => setForm({ ...form, contentTypes: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Features (comma separated)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
        <input className="input md:col-span-3" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <button className="btn-primary">Add server</button>
        {err && <div className="md:col-span-4 text-sm text-red-600">{err}</div>}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Code</th>
              <th className="table-th">Category</th>
              <th className="table-th">Host</th>
              <th className="table-th">Access</th>
              <th className="table-th">Capacity</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={8}>Loading…</td></tr>}
            {data?.items?.map((s) => (
              <tr key={s._id}>
                <td className="table-td font-medium">{s.name}</td>
                <td className="table-td font-mono text-xs">{s.code}</td>
                <td className="table-td capitalize">{s.category}</td>
                <td className="table-td font-mono text-xs">{s.host}</td>
                <td className="table-td capitalize">{s.accessLevel}</td>
                <td className="table-td">{s.capacityTB} TB / {s.maxSpeedMbps} Mbps</td>
                <td className="table-td"><span className={s.isActive ? 'badge-green' : 'badge-slate'}>{s.isActive ? 'Active' : 'Disabled'}</span></td>
                <td className="table-td">
                  <button onClick={() => toggle(s)} className="text-xs text-brand-600 hover:underline">
                    {s.isActive ? 'Disable' : 'Enable'}
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
