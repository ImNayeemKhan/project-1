'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface User { _id: string; name: string; email: string; walletBalance: number }
interface Txn {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  note?: string;
  balanceAfter: number;
  createdAt: string;
}

export default function AdminWalletPage() {
  const [q, setQ] = useState('');
  const { data: users } = useSWR<{ items: User[] }>(
    `/api/admin/users?role=customer&q=${encodeURIComponent(q)}&limit=20`
  );
  const [selected, setSelected] = useState<User | null>(null);
  const walletKey = selected ? `/api/admin/wallet/${selected._id}` : null;
  const { data: wallet } = useSWR<{ user: User; transactions: Txn[] }>(walletKey);

  const [form, setForm] = useState({ type: 'credit' as Txn['type'], amount: 0, note: '' });
  const [err, setErr] = useState<string | null>(null);

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!selected) return;
    try {
      await api.post(`/api/admin/wallet/${selected._id}/adjust`, form);
      setForm({ type: 'credit', amount: 0, note: '' });
      if (walletKey) mutate(walletKey);
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Customer wallet</h1>
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="card space-y-3">
          <input
            className="input"
            placeholder="Search customer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="divide-y divide-slate-100">
            {users?.items?.map((u) => (
              <li key={u._id}>
                <button
                  onClick={() => setSelected(u)}
                  className={`flex w-full flex-col items-start py-2 text-left ${
                    selected?._id === u._id ? 'text-brand-700' : 'text-slate-700 hover:text-brand-600'
                  }`}
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-slate-500">{u.email} · ৳ {u.walletBalance ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {!selected && <div className="card text-slate-500">Select a customer to view wallet.</div>}
          {selected && wallet && (
            <>
              <div className="card flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{wallet.user.email}</div>
                  <div className="text-lg font-semibold text-slate-900">{wallet.user.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Balance</div>
                  <div className="text-2xl font-semibold text-slate-900">৳ {wallet.user.walletBalance ?? 0}</div>
                </div>
              </div>

              <form onSubmit={adjust} className="card grid grid-cols-1 gap-3 sm:grid-cols-4">
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Txn['type'] })}>
                  <option value="credit">Credit (add)</option>
                  <option value="debit">Debit (remove)</option>
                </select>
                <input
                  className="input"
                  type="number"
                  placeholder="Amount"
                  min={1}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: +e.target.value })}
                  required
                />
                <input className="input sm:col-span-2" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                {err && <div className="col-span-4 text-sm text-red-600">{err}</div>}
                <button className="btn-primary sm:col-span-4">Apply adjustment</button>
              </form>

              <div className="card overflow-x-auto p-0">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-th">When</th>
                      <th className="table-th">Type</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Balance</th>
                      <th className="table-th">Reason</th>
                      <th className="table-th">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wallet.transactions?.length === 0 && (
                      <tr><td className="table-td" colSpan={6}>No transactions.</td></tr>
                    )}
                    {wallet.transactions?.map((t) => (
                      <tr key={t._id}>
                        <td className="table-td">{new Date(t.createdAt).toLocaleString()}</td>
                        <td className="table-td"><span className={t.type === 'credit' ? 'badge-green' : 'badge-yellow'}>{t.type}</span></td>
                        <td className="table-td">৳ {t.amount}</td>
                        <td className="table-td">৳ {t.balanceAfter}</td>
                        <td className="table-td">{t.reason}</td>
                        <td className="table-td">{t.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
