'use client';
import Link from 'next/link';
import useSWR from 'swr';

interface Ticket {
  _id: string;
  ticketNo: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
}

const statusTone: Record<Ticket['status'], string> = {
  open: 'badge-yellow',
  pending: 'badge-slate',
  resolved: 'badge-green',
  closed: 'badge-slate',
};

export default function CustomerTicketsPage() {
  const { data, isLoading } = useSWR<{ items: Ticket[] }>('/api/customer/tickets');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">My tickets</h1>
        <Link href="/customer/tickets/new" className="btn-primary">New ticket</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Ticket</th>
              <th className="table-th">Subject</th>
              <th className="table-th">Category</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Status</th>
              <th className="table-th">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={6}>Loading…</td></tr>}
            {data?.items?.length === 0 && (
              <tr><td className="table-td" colSpan={6}>You haven&apos;t raised any tickets yet.</td></tr>
            )}
            {data?.items?.map((t) => (
              <tr key={t._id}>
                <td className="table-td font-mono text-xs">
                  <Link href={`/customer/tickets/${t._id}`} className="text-brand-600 hover:underline">{t.ticketNo}</Link>
                </td>
                <td className="table-td font-medium">{t.subject}</td>
                <td className="table-td">{t.category}</td>
                <td className="table-td">{t.priority}</td>
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
