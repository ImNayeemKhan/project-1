'use client';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

interface Ticket {
  _id: string;
  ticketNo: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  customer: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

const priorityTone: Record<Ticket['priority'], string> = {
  low: 'badge-slate',
  normal: 'badge-slate',
  high: 'badge-yellow',
  urgent: 'badge-red',
};

const statusTone: Record<Ticket['status'], string> = {
  open: 'badge-yellow',
  pending: 'badge-slate',
  resolved: 'badge-green',
  closed: 'badge-slate',
};

export default function AdminTicketsPage() {
  const [status, setStatus] = useState('');
  const qs = status ? `?status=${status}` : '';
  const { data, isLoading } = useSWR<{ items: Ticket[] }>(`/api/admin/tickets${qs}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Support tickets</h1>
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Ticket</th>
              <th className="table-th">Subject</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Status</th>
              <th className="table-th">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={6}>Loading…</td></tr>}
            {data?.items?.length === 0 && <tr><td className="table-td" colSpan={6}>No tickets.</td></tr>}
            {data?.items?.map((t) => (
              <tr key={t._id}>
                <td className="table-td font-mono text-xs">
                  <Link className="text-brand-600 hover:underline" href={`/admin/tickets/${t._id}`}>{t.ticketNo}</Link>
                </td>
                <td className="table-td font-medium text-slate-900">{t.subject}</td>
                <td className="table-td">{t.customer?.name ?? '—'}</td>
                <td className="table-td"><span className={priorityTone[t.priority]}>{t.priority}</span></td>
                <td className="table-td"><span className={statusTone[t.status]}>{t.status}</span></td>
                <td className="table-td">{new Date(t.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
