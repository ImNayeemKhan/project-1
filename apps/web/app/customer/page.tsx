'use client';
import useSWR from 'swr';

interface Me {
  user: { _id: string; name: string; email: string; phone?: string };
  subscriptions: Array<{
    _id: string;
    pppoeUsername: string;
    status: string;
    nextBillingDate: string;
    package: { name: string; code: string; monthlyPrice: number; downloadMbps: number; uploadMbps: number };
  }>;
}

export default function CustomerHome() {
  const { data, isLoading } = useSWR<Me>('/api/customer/me');
  if (isLoading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome, {data?.user.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.subscriptions.map((s) => (
          <div key={s._id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">{s.package.name}</div>
                <div className="text-sm text-slate-500">{s.package.downloadMbps}/{s.package.uploadMbps} Mbps</div>
              </div>
              <span className={s.status === 'active' ? 'badge-green' : s.status === 'suspended' ? 'badge-red' : 'badge-yellow'}>
                {s.status}
              </span>
            </div>
            <div className="text-sm text-slate-600">PPPoE: <span className="font-mono">{s.pppoeUsername}</span></div>
            <div className="text-sm text-slate-600">Next bill: {new Date(s.nextBillingDate).toLocaleDateString()}</div>
            <div className="text-sm font-semibold text-slate-900">৳ {s.package.monthlyPrice.toLocaleString()}/mo</div>
          </div>
        ))}
        {data?.subscriptions.length === 0 && (
          <div className="card text-slate-500">No active subscriptions yet. Contact your ISP to get connected.</div>
        )}
      </div>
    </div>
  );
}
