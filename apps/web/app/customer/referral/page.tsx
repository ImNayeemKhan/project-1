'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api, extractError } from '@/lib/api';

interface Me {
  subscriptions: Array<{ _id: string; package: { name: string } }>;
}

interface ReferralResponse {
  code: string;
  invitedCount: number;
}

export default function ReferralPage() {
  const { data: me } = useSWR<Me>('/api/customer/me');
  const sub = me?.subscriptions[0];
  const { data: ref, mutate: refetch } = useSWR<ReferralResponse>(
    sub ? `/api/customer/subscriptions/${sub._id}/referral` : null
  );
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!me) return <div>Loading…</div>;
  if (!sub) return <div className="card text-slate-500">Activate a subscription to unlock referrals.</div>;

  const shareUrl = ref ? `${typeof window !== 'undefined' ? window.location.origin : ''}/contact?ref=${ref.code}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Refer a friend</h1>
      <div className="card space-y-4">
        <p className="text-sm text-slate-600">
          Share your code and both of you get <strong>1 month free</strong> after they activate.
        </p>
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 p-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Your code</div>
          <div className="mt-2 text-4xl font-bold tracking-widest">{ref?.code ?? '—'}</div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm">
            <code className="truncate">{shareUrl}</code>
            <button
              onClick={copy}
              className="ml-auto rounded bg-white px-3 py-1 text-xs font-semibold text-brand-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          You&apos;ve referred <strong>{ref?.invitedCount ?? 0}</strong> customer
          {ref?.invitedCount === 1 ? '' : 's'} so far.
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn" onClick={() => refetch()}>
          Refresh
        </button>
      </div>
      <div className="card text-sm text-slate-600">
        <div className="font-semibold text-slate-900">How it works</div>
        <ol className="ml-5 mt-2 list-decimal space-y-1">
          <li>Share your link with a friend.</li>
          <li>They apply for a connection using the link or enter the code on the contact form.</li>
          <li>Once they pay their first invoice, both of you receive a 1-month credit automatically.</li>
        </ol>
      </div>
    </div>
  );
}
