'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Package {
  _id: string;
  name: string;
  code: string;
  monthlyPrice: number;
  downloadMbps: number;
  uploadMbps: number;
  category?: string;
}

interface Me {
  subscriptions: Array<{
    _id: string;
    pppoeUsername: string;
    status: string;
    autoPay?: boolean;
    pausedAt?: string;
    pauseEndsAt?: string;
    nextBillingDate: string;
    package: Package;
  }>;
}

interface QuoteResponse {
  proration: {
    net: number;
    unusedOldCredit: number;
    newPlanCharge: number;
    daysRemaining: number;
    totalDays: number;
  };
  newMonthly: number;
}

export default function SubscriptionPage() {
  const { data: me, isLoading } = useSWR<Me>('/api/customer/me');
  const { data: catalog } = useSWR<{ items: Package[] }>('/api/public/packages');

  if (isLoading) return <div>Loading…</div>;
  const subs = me?.subscriptions ?? [];

  if (subs.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Manage plan</h1>
        <p className="mt-2 text-slate-500">No active subscription to manage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Manage your plan</h1>
      {subs.map((s) => (
        <SubscriptionCard key={s._id} sub={s} catalog={catalog?.items ?? []} />
      ))}
    </div>
  );
}

function SubscriptionCard({
  sub,
  catalog,
}: {
  sub: Me['subscriptions'][number];
  catalog: Package[];
}) {
  const [targetId, setTargetId] = useState<string>('');
  const [applyNow, setApplyNow] = useState(true);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pauseDays, setPauseDays] = useState(7);

  const getQuote = async (pkgId: string) => {
    setTargetId(pkgId);
    setQuote(null);
    if (!pkgId) return;
    try {
      const res = await api.get<QuoteResponse>(
        `/api/customer/subscriptions/${sub._id}/change-plan/quote?packageId=${pkgId}`
      );
      setQuote(res.data);
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const confirmChange = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.post(`/api/customer/subscriptions/${sub._id}/change-plan`, {
        packageId: targetId,
        applyNow,
      });
      const data = res.data as { mode: 'immediate' | 'queued'; invoiceId?: string };
      setMsg(
        data.mode === 'queued'
          ? `Queued — the new plan takes effect at your next billing date.`
          : data.invoiceId
          ? `Pro-rated invoice created. Pay it to activate the new plan.`
          : `Done — the new plan is active.`
      );
      mutate('/api/customer/me');
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async () => {
    setErr(null);
    setBusy(true);
    try {
      if (sub.pausedAt) {
        await api.post(`/api/customer/subscriptions/${sub._id}/resume`);
        setMsg('Service resumed.');
      } else {
        await api.post(`/api/customer/subscriptions/${sub._id}/pause`, { days: pauseDays });
        setMsg(`Service paused for ${pauseDays} days.`);
      }
      mutate('/api/customer/me');
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleAutoPay = async () => {
    setErr(null);
    try {
      await api.post(`/api/customer/subscriptions/${sub._id}/autopay`, {
        enabled: !sub.autoPay,
      });
      mutate('/api/customer/me');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const eligible = catalog.filter((p) => p._id !== sub.package._id && p.code);

  return (
    <div className="card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Current plan</div>
          <div className="text-xl font-semibold text-slate-900">{sub.package.name}</div>
          <div className="text-sm text-slate-600">
            {sub.package.downloadMbps}/{sub.package.uploadMbps} Mbps · ৳
            {sub.package.monthlyPrice}/mo
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Next bill: {new Date(sub.nextBillingDate).toLocaleDateString()}
          </div>
        </div>
        <span
          className={
            sub.status === 'active'
              ? 'badge-green'
              : sub.status === 'suspended'
              ? 'badge-red'
              : 'badge-yellow'
          }
        >
          {sub.status}
        </span>
      </div>

      {msg && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Upgrade / downgrade */}
      <div className="rounded-lg border border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-900">Change plan</div>
        <p className="text-xs text-slate-500">
          Upgrade immediately with pro-rated charge, or queue any change for next cycle.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_auto]">
          <select
            className="input"
            value={targetId}
            onChange={(e) => getQuote(e.target.value)}
          >
            <option value="">— pick a new plan —</option>
            {eligible.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} · ৳{p.monthlyPrice}/mo ({p.downloadMbps} Mbps)
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={applyNow}
              onChange={(e) => setApplyNow(e.target.checked)}
            />
            Apply now (pro-rated)
          </label>
        </div>

        {quote && (
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <div>
              New plan: <strong>৳{quote.newMonthly}/mo</strong>
            </div>
            <div>
              Unused credit on current plan:{' '}
              <strong>৳{quote.proration.unusedOldCredit}</strong> ·{' '}
              {quote.proration.daysRemaining} of {quote.proration.totalDays} days left
            </div>
            <div>
              Pro-rated new charge: <strong>৳{quote.proration.newPlanCharge}</strong>
            </div>
            <div className="mt-1 text-base font-semibold">
              {quote.proration.net > 0
                ? `Charged now: ৳${quote.proration.net}`
                : `Net credit: ৳${Math.abs(quote.proration.net)} — no charge`}
            </div>
          </div>
        )}

        <button
          onClick={confirmChange}
          disabled={busy || !targetId}
          className="btn-primary mt-3"
        >
          {busy ? 'Working…' : applyNow ? 'Apply change' : 'Queue for next cycle'}
        </button>
      </div>

      {/* Pause */}
      <div className="rounded-lg border border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-900">Pause / vacation hold</div>
        <p className="text-xs text-slate-500">
          Keep your PPPoE username reserved while you&apos;re away. Up to 30 days per year.
        </p>
        {sub.pausedAt ? (
          <div className="mt-3 space-y-2 text-sm">
            <div className="text-amber-700">
              Paused until {sub.pauseEndsAt ? new Date(sub.pauseEndsAt).toDateString() : '—'}.
            </div>
            <button onClick={togglePause} disabled={busy} className="btn-primary">
              {busy ? 'Working…' : 'Resume service now'}
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-slate-600">
              Days:{' '}
              <input
                type="number"
                value={pauseDays}
                onChange={(e) => setPauseDays(Number(e.target.value))}
                min={3}
                max={30}
                className="input w-24"
              />
            </label>
            <button onClick={togglePause} disabled={busy} className="btn-primary">
              {busy ? 'Working…' : 'Pause service'}
            </button>
          </div>
        )}
      </div>

      {/* Autopay */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Auto-pay with bKash</div>
          <p className="text-xs text-slate-500">
            Invoices are charged automatically on due date. You can turn this off any time.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={!!sub.autoPay}
            onChange={toggleAutoPay}
          />
          <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
        </label>
      </div>
    </div>
  );
}
