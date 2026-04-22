'use client';

import { useMemo, useState } from 'react';
import { api, extractError } from '@/lib/api';

type Window = 'morning' | 'afternoon' | 'evening';

const WINDOW_LABELS: Record<Window, string> = {
  morning: 'Morning (9am–12pm)',
  afternoon: 'Afternoon (12pm–5pm)',
  evening: 'Evening (5pm–8pm)',
};

function nextBusinessDays(n: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // earliest = tomorrow
  while (out.length < n) {
    const copy = new Date(d);
    out.push({
      value: copy.toISOString().slice(0, 10),
      label: copy.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function InstallSlotBooking({ packageId }: { packageId?: string }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [date, setDate] = useState<string>('');
  const [slot, setSlot] = useState<Window>('morning');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const days = useMemo(() => nextBusinessDays(7), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!date) {
      setErr('Please pick a day');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/public/book-install', {
        ...form,
        slotDate: date,
        slotWindow: slot,
        packageInterest: packageId,
      });
      setDone(true);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
        <div className="text-lg font-semibold text-emerald-900">You&apos;re booked!</div>
        <p className="mt-2">
          An installer will ring you to confirm {new Date(date).toDateString()} ·{' '}
          {WINDOW_LABELS[slot].toLowerCase()}. Expect a call within the hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Book an installation slot</h3>
      <p className="text-sm text-slate-500">
        Tell us where and when — we&apos;ll install fiber, set up Wi-Fi, and hand over credentials.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Mobile"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="input sm:col-span-2"
          type="email"
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input sm:col-span-2"
          placeholder="Installation address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Pick a day</div>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                date === d.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Pick a time window</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(WINDOW_LABELS) as Window[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSlot(w)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                slot === w
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {WINDOW_LABELS[w]}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      <button disabled={busy} className="btn-primary mt-5 w-full justify-center">
        {busy ? 'Booking…' : 'Book installation'}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        No payment required now. We&apos;ll confirm availability within 10 minutes.
      </p>
    </form>
  );
}
