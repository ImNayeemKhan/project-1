'use client';

import { useState } from 'react';
import { api, extractError } from '@/lib/api';

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; email?: string; error: string }[];
}

const sample = `name,email,phone,address,nid,zone
Kamal Ahmed,kamal@example.com,+8801700000000,Mohammadpur Dhaka,1980123456789,Dhaka North
Rafia Khatun,rafia@example.com,+8801800000000,Dhanmondi Dhaka,1991123456789,Dhaka North
`;

export default function BulkImportPage() {
  const [csv, setCsv] = useState(sample);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const { data } = await api.post<ImportResult>('/api/admin/bulk-import/customers', {
        csv,
        dryRun,
      });
      setResult(data);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Bulk import customers</h1>
      <div className="card space-y-3">
        <div className="text-sm text-slate-600">
          Paste a CSV with <code>name,email,phone,address,nid,zone</code>. Only{' '}
          <strong>name</strong> and <strong>email</strong> are required. Zone must match an
          existing zone name. Existing emails are updated in place.
        </div>
        <textarea
          className="input h-64 font-mono text-xs"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="flex gap-3">
          <button className="btn" onClick={() => run(true)} disabled={busy}>
            Dry run
          </button>
          <button className="btn-primary" onClick={() => run(false)} disabled={busy}>
            {busy ? 'Importing…' : 'Import'}
          </button>
        </div>
        {err && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      </div>

      {result && (
        <div className="card space-y-2">
          <div className="text-sm font-semibold text-slate-900">Results</div>
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <Stat label="Rows" value={result.total} />
            <Stat label="Created" value={result.created} tone="green" />
            <Stat label="Updated" value={result.updated} tone="blue" />
            <Stat label="Skipped / errors" value={result.skipped + result.errors.length} tone="amber" />
          </div>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-brand-600">
                {result.errors.length} error{result.errors.length === 1 ? '' : 's'}
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {result.errors.map((e, i) => (
                  <li key={i} className="font-mono">
                    row {e.row} {e.email ? `(${e.email})` : ''}: {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'blue' | 'amber' }) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'blue'
      ? 'bg-sky-50 text-sky-700'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-lg px-4 py-3 ${toneClass}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
