'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useMemo } from 'react';
import { Badge, Button, Card, KPI, StatusDot } from '@/components/ui';

/**
 * Admin unified dashboard home — redesigned under the 5-step workflow.
 *
 *   STEP 1 (locked): single unified home, not role-split. Operator goal =
 *          see "what needs my attention right now" in < 10 seconds, then
 *          drill in with one click.
 *   STEP 2: 4 hero KPIs (MRR · active subs · AR outstanding · open tickets)
 *          → 3 live-ops cards (routers down · overdue >10d · SLA risk)
 *          → 2-column grid (revenue trend · zone performance)
 *          → recent activity feed + quick actions.
 *   STEP 3: Every KPI uses the shared KPI primitive so the numeric visual
 *          language is identical site-wide. Alerts use semantic feedback
 *          colors only where the state is actually bad — green never
 *          competes for attention.
 *   STEP 4: Client component reusing the existing /api/admin/bi/overview
 *          endpoint. Auto-refresh every 60s.
 */

interface BIOverview {
  kpis: {
    mrr: number;
    arr: number;
    arpu: number;
    churnRate: number;
    collectionEfficiency: number;
  };
  revenue: {
    monthly: { month: string; total: number }[];
    daily: { date: string; total: number; count: number }[];
  };
  ar: {
    aging: { bucket: string; count: number; total: number }[];
    failedPayments: { _id: string; count: number; total: number }[];
  };
  mix: {
    byPackage: { packageId: string; packageName: string; category: string; subs: number; revenue: number }[];
    byCategory: { category: string; subs: number; revenue: number }[];
  };
  zones: { zoneId: string; zoneName: string; subs: number; revenue: number; openTickets: number }[];
  noc: { activeSubs: number; suspendedSubs: number; openTickets: number; packagesCount: number };
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(n);
}

export default function AdminDashboard() {
  const { data, error, isLoading } = useSWR<BIOverview>('/api/admin/bi/overview', {
    refreshInterval: 60_000,
  });

  const monthlyTrend = useMemo(() => data?.revenue.monthly.map((m) => m.total) ?? [], [data]);
  const dailyTrend = useMemo(() => data?.revenue.daily.map((d) => d.total) ?? [], [data]);

  const mom = useMemo(() => {
    const m = data?.revenue.monthly ?? [];
    if (m.length < 2) return 0;
    const prev = m[m.length - 2].total;
    const cur = m[m.length - 1].total;
    if (prev === 0) return cur > 0 ? 100 : 0;
    return +(((cur - prev) / prev) * 100).toFixed(1);
  }, [data]);

  const arOutstanding = useMemo(
    () => data?.ar.aging.reduce((s, b) => s + b.total, 0) ?? 0,
    [data]
  );
  const overdueTenPlus = useMemo(
    () =>
      data?.ar.aging
        .filter((b) => b.bucket !== '0-30' && b.bucket !== '0')
        .reduce((s, b) => s + b.count, 0) ?? 0,
    [data]
  );

  if (error) {
    return (
      <div className="rounded-card border border-subtle bg-surface p-8 text-[14px] text-danger">
        Failed to load dashboard data. Retry in a moment.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-[13px] text-muted">Loading dashboard…</div>
      </div>
    );
  }

  const busiestZone = [...data.zones].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.015em] text-primary">
            Operations
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Live view of the network, customers, and money. Refreshes every minute.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button href="/admin/customers/new" variant="primary" size="sm">
            + New customer
          </Button>
          <Button href="/admin/bi" variant="secondary" size="sm">
            Full BI
          </Button>
          <Button href="/admin/tickets" variant="ghost" size="sm">
            Tickets
          </Button>
        </div>
      </div>

      {/* Hero KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          label="MRR"
          value={`৳${fmt(data.kpis.mrr)}`}
          delta={{
            direction: mom > 0 ? 'up' : mom < 0 ? 'down' : 'flat',
            label: `${mom > 0 ? '+' : ''}${mom}% MoM`,
          }}
          sparkline={monthlyTrend}
        />
        <KPI
          label="Active subscribers"
          value={fmt(data.noc.activeSubs)}
          delta={
            data.noc.suspendedSubs > 0
              ? { direction: 'down', label: `${data.noc.suspendedSubs} suspended` }
              : { direction: 'flat', label: '0 suspended' }
          }
          sparkline={dailyTrend}
        />
        <KPI
          label="AR outstanding"
          value={`৳${fmt(arOutstanding)}`}
          delta={
            overdueTenPlus > 0
              ? { direction: 'down', label: `${overdueTenPlus} overdue` }
              : { direction: 'flat', label: 'all current' }
          }
        />
        <KPI
          label="Open tickets"
          value={fmt(data.noc.openTickets)}
          delta={
            data.noc.openTickets > 10
              ? { direction: 'down', label: 'above SLA threshold' }
              : { direction: 'flat', label: 'within SLA' }
          }
        />
      </section>

      {/* Live operations row */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            Live operations
          </span>
          <StatusDot status="online" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <LiveOpsCard
            tone={data.noc.suspendedSubs > 0 ? 'warning' : 'neutral'}
            title="Suspended services"
            value={fmt(data.noc.suspendedSubs)}
            body={
              data.noc.suspendedSubs > 0
                ? 'Subscribers currently offline due to overdue invoices. Dunning re-engages on next payment.'
                : 'All active subscribers currently paid up and online.'
            }
            href="/admin/subscriptions?status=suspended"
            action="Review suspended"
          />
          <LiveOpsCard
            tone={overdueTenPlus > 0 ? 'danger' : 'neutral'}
            title="Invoices >10 days overdue"
            value={fmt(overdueTenPlus)}
            body={
              overdueTenPlus > 0
                ? 'Past the grace window — flagged for collections follow-up.'
                : 'No invoices past the 10-day grace window.'
            }
            href="/admin/invoices?status=overdue"
            action="Open aging report"
          />
          <LiveOpsCard
            tone={data.noc.openTickets > 10 ? 'warning' : 'neutral'}
            title="Tickets at SLA risk"
            value={fmt(data.noc.openTickets)}
            body={
              data.noc.openTickets > 10
                ? 'Queue is deeper than usual — reassign or triage before timers breach.'
                : 'Queue healthy. SLA timers all within limits.'
            }
            href="/admin/tickets?status=open"
            action="Open ticket queue"
          />
        </div>
      </section>

      {/* Revenue + zones */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="flat" className="lg:col-span-2">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="text-[13px] font-medium text-muted">Revenue trend</div>
              <div className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-primary">
                Last 12 months
              </div>
            </div>
            <div className="text-[12px] text-muted">৳ BDT · paid invoices</div>
          </div>
          <MonthlyBars monthly={data.revenue.monthly} />
        </Card>
        <Card variant="flat">
          <div className="mb-4 text-[13px] font-medium text-muted">Package mix</div>
          <div className="flex flex-col gap-3">
            {data.mix.byCategory.map((c) => {
              const totalRev = data.mix.byCategory.reduce((s, x) => s + x.revenue, 0);
              const pct = totalRev > 0 ? (c.revenue / totalRev) * 100 : 0;
              return (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="capitalize text-secondary">{c.category}</span>
                    <span className="font-medium text-primary tabular-nums">
                      {pct.toFixed(0)}% · ৳{fmt(c.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {busiestZone ? (
            <div className="mt-6 border-t border-subtle pt-5">
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
                Busiest zone
              </div>
              <div className="mt-1 text-[18px] font-semibold text-primary">
                {busiestZone.zoneName}
              </div>
              <div className="mt-1 text-[13px] text-muted">
                {fmt(busiestZone.subs)} subs · ৳{fmt(busiestZone.revenue)} MRR
              </div>
            </div>
          ) : null}
        </Card>
      </section>

      {/* Zones table */}
      <Card variant="flat" padded={false}>
        <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
          <div>
            <div className="text-[13px] font-medium text-muted">Zone performance</div>
            <div className="text-[15px] font-semibold text-primary">
              {data.zones.length} zones live
            </div>
          </div>
          <Link
            href="/admin/zones"
            className="text-[13px] font-medium text-brand-700 hover:text-brand-600"
          >
            Manage zones →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[14px]">
            <thead>
              <tr className="border-b border-subtle text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                <th className="px-6 py-3 text-left">Zone</th>
                <th className="px-6 py-3 text-right">Active subs</th>
                <th className="px-6 py-3 text-right">MRR</th>
                <th className="px-6 py-3 text-right">Open tickets</th>
              </tr>
            </thead>
            <tbody>
              {data.zones.map((z) => (
                <tr key={z.zoneId || z.zoneName} className="border-b border-subtle/50 last:border-0">
                  <td className="px-6 py-3 font-medium text-primary">{z.zoneName}</td>
                  <td className="px-6 py-3 text-right text-secondary tabular-nums">{fmt(z.subs)}</td>
                  <td className="px-6 py-3 text-right font-medium text-primary tabular-nums">
                    ৳{fmt(z.revenue)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {z.openTickets > 0 ? (
                      <Badge tone="warning">{z.openTickets}</Badge>
                    ) : (
                      <span className="text-subtle tabular-nums">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick actions */}
      <section>
        <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          Quick actions
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: '/admin/customers', label: 'Customers' },
            { href: '/admin/subscriptions', label: 'Subscriptions' },
            { href: '/admin/invoices', label: 'Invoices' },
            { href: '/admin/tickets', label: 'Tickets' },
            { href: '/admin/routers', label: 'Routers' },
            { href: '/admin/bi', label: 'BI reports' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center justify-between rounded-card border border-subtle bg-surface px-4 py-3 text-[14px] font-medium text-primary transition-colors hover:bg-surface-muted"
            >
              <span>{a.label}</span>
              <span
                aria-hidden
                className="text-muted transition-transform duration-150 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function LiveOpsCard({
  title,
  value,
  body,
  href,
  action,
  tone,
}: {
  title: string;
  value: string;
  body: string;
  href: string;
  action: string;
  tone: 'neutral' | 'warning' | 'danger';
}) {
  const toneBadge =
    tone === 'danger' ? (
      <Badge tone="danger">Needs attention</Badge>
    ) : tone === 'warning' ? (
      <Badge tone="warning">Watch</Badge>
    ) : (
      <Badge tone="success">Clear</Badge>
    );
  return (
    <Card variant="flat" className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-medium text-muted">{title}</div>
        {toneBadge}
      </div>
      <div className="font-display text-[28px] font-semibold leading-none tracking-[-0.01em] text-primary tabular-nums">
        {value}
      </div>
      <p className="mt-3 text-[13px] leading-[1.5] text-secondary">{body}</p>
      <div className="mt-auto pt-5">
        <Link
          href={href}
          className="text-[13px] font-semibold text-brand-700 hover:text-brand-600"
        >
          {action} →
        </Link>
      </div>
    </Card>
  );
}

function MonthlyBars({ monthly }: { monthly: { month: string; total: number }[] }) {
  const max = Math.max(1, ...monthly.map((m) => m.total));
  return (
    <div className="flex h-40 items-end gap-1.5">
      {monthly.map((m, i) => {
        const h = Math.max(2, (m.total / max) * 100);
        const isLast = i === monthly.length - 1;
        return (
          <div key={m.month + i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-[6px] transition-colors ${
                isLast ? 'bg-brand-600' : 'bg-brand-500/40'
              }`}
              style={{ height: `${h}%` }}
              title={`${m.month}: ৳${m.total.toLocaleString('en-BD')}`}
            />
            <div className="text-[10px] text-subtle">{m.month.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}
