'use client';
import useSWR from 'swr';

interface Stat { label: string; value: string | number; tone?: 'green' | 'yellow' | 'red' | 'slate' }

function Stat({ label, value, tone = 'slate' }: Stat) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold text-slate-900`}>{value}</div>
      <div className={`mt-1 badge-${tone}`} />
    </div>
  );
}

export default function AdminDashboard() {
  const { data: users } = useSWR<{ items: any[]; total: number }>('/api/admin/users?limit=1');
  const { data: subs } = useSWR<{ items: any[] }>('/api/admin/subscriptions');
  const { data: invoices } = useSWR<{ items: any[] }>('/api/admin/invoices');

  const activeSubs = subs?.items?.filter((s) => s.status === 'active').length ?? 0;
  const suspended = subs?.items?.filter((s) => s.status === 'suspended').length ?? 0;
  const unpaid = invoices?.items?.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length ?? 0;
  const monthRevenue = invoices?.items
    ?.filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={users?.total ?? '—'} />
        <Stat label="Active subscriptions" value={activeSubs} tone="green" />
        <Stat label="Suspended" value={suspended} tone="red" />
        <Stat label="Unpaid invoices" value={unpaid} tone="yellow" />
      </div>
      <div className="card">
        <div className="text-sm text-slate-600">Paid-invoice revenue (all time)</div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">৳ {monthRevenue.toLocaleString()}</div>
      </div>
    </div>
  );
}
