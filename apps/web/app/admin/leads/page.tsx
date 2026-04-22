'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  notes?: string;
  createdAt: string;
}

const statusTone: Record<Lead['status'], string> = {
  new: 'badge-yellow',
  contacted: 'badge-slate',
  qualified: 'badge-green',
  converted: 'badge-green',
  lost: 'badge-red',
};

export default function AdminLeadsPage() {
  const [status, setStatus] = useState('');
  const qs = status ? `?status=${status}` : '';
  const { data, isLoading } = useSWR<{ items: Lead[] }>(`/api/admin/leads${qs}`);
  const [err, setErr] = useState<string | null>(null);

  const setLeadStatus = async (id: string, s: Lead['status']) => {
    try {
      await api.patch(`/api/admin/leads/${id}`, { status: s });
      mutate(`/api/admin/leads${qs}`);
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Sales leads</h1>
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      {err && <div className="card border-red-200 bg-red-50 text-sm text-red-700">{err}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Address</th>
              <th className="table-th">Source</th>
              <th className="table-th">Status</th>
              <th className="table-th">Received</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={7}>Loading…</td></tr>}
            {data?.items?.length === 0 && <tr><td className="table-td" colSpan={7}>No leads yet.</td></tr>}
            {data?.items?.map((l) => (
              <tr key={l._id}>
                <td className="table-td font-medium text-slate-900">{l.name}</td>
                <td className="table-td"><a className="text-brand-600 hover:underline" href={`tel:${l.phone}`}>{l.phone}</a></td>
                <td className="table-td">{l.address ?? '—'}</td>
                <td className="table-td">{l.source}</td>
                <td className="table-td"><span className={statusTone[l.status]}>{l.status}</span></td>
                <td className="table-td">{new Date(l.createdAt).toLocaleDateString()}</td>
                <td className="table-td">
                  <select
                    className="input py-1 text-xs"
                    value={l.status}
                    onChange={(e) => setLeadStatus(l._id, e.target.value as Lead['status'])}
                  >
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="qualified">qualified</option>
                    <option value="converted">converted</option>
                    <option value="lost">lost</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
