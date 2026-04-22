'use client';
import useSWR from 'swr';

interface Summary {
  totals: {
    totalCustomers: number;
    activeSubs: number;
    suspendedSubs: number;
    openTickets: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    newCustomersLast30: number;
  };
  revenue: { currentMonth: number; last30Days: number };
}

interface AgingBucket { bucket: string; count: number; total: number }
interface TrendItem { _id: string; total: number; count: number }

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {tone && <div className={`mt-1 ${tone}`} />}
    </div>
  );
}

export default function AdminReportsPage() {
  const { data: summary } = useSWR<Summary>('/api/admin/reports/summary');
  const { data: aging } = useSWR<{ buckets: AgingBucket[] }>('/api/admin/reports/aging');
  const { data: trend } = useSWR<{ items: TrendItem[] }>('/api/admin/reports/revenue-trend');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Business reports</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">KPIs</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi label="Total customers" value={summary?.totals.totalCustomers ?? '—'} />
          <Kpi label="Active subs" value={summary?.totals.activeSubs ?? '—'} />
          <Kpi label="Suspended" value={summary?.totals.suspendedSubs ?? '—'} />
          <Kpi label="New (30d)" value={summary?.totals.newCustomersLast30 ?? '—'} />
          <Kpi label="Open tickets" value={summary?.totals.openTickets ?? '—'} />
          <Kpi label="Unpaid invoices" value={summary?.totals.unpaidInvoices ?? '—'} />
          <Kpi label="Overdue" value={summary?.totals.overdueInvoices ?? '—'} />
          <Kpi label="Revenue (this month)" value={`৳ ${(summary?.revenue.currentMonth ?? 0).toLocaleString()}`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Receivables aging</h2>
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Bucket (days overdue)</th>
                <th className="table-th">Invoices</th>
                <th className="table-th">Outstanding amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aging?.buckets?.map((b) => (
                <tr key={b.bucket}>
                  <td className="table-td">{b.bucket}</td>
                  <td className="table-td">{b.count}</td>
                  <td className="table-td">৳ {b.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Revenue — last 30 days</h2>
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Date</th>
                <th className="table-th">Transactions</th>
                <th className="table-th">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trend?.items?.length === 0 && <tr><td className="table-td" colSpan={3}>No revenue recorded.</td></tr>}
              {trend?.items?.map((r) => (
                <tr key={r._id}>
                  <td className="table-td">{r._id}</td>
                  <td className="table-td">{r.count}</td>
                  <td className="table-td">৳ {r.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
