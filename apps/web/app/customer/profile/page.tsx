'use client';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Me {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    nid?: string;
    walletBalance: number;
  };
}

interface Txn {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  note?: string;
  balanceAfter: number;
  createdAt: string;
}

export default function CustomerProfilePage() {
  const { data: me } = useSWR<Me>('/api/customer/me');
  const { data: wallet } = useSWR<{ balance: number; transactions: Txn[] }>('/api/customer/wallet');

  const [form, setForm] = useState({ name: '', phone: '', address: '', nid: '' });
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me?.user) {
      setForm({
        name: me.user.name ?? '',
        phone: me.user.phone ?? '',
        address: me.user.address ?? '',
        nid: me.user.nid ?? '',
      });
    }
  }, [me?.user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    try {
      await api.patch('/api/customer/me', form);
      setSaved(true);
      mutate('/api/customer/me');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="card space-y-3">
          {saved && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Profile updated.</div>}
          {err && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input className="input bg-slate-50" value={me?.user?.email ?? ''} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Installation address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">NID / passport number</label>
            <input className="input" value={form.nid} onChange={(e) => setForm({ ...form, nid: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">
              Required for KYC. To submit identity documents, contact support — upload form coming soon.
            </p>
          </div>
          <button className="btn-primary">Save changes</button>
        </form>

        <aside className="space-y-4">
          <div className="card">
            <div className="text-xs uppercase tracking-wide text-slate-500">Wallet balance</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              ৳ {(wallet?.balance ?? me?.user?.walletBalance ?? 0).toLocaleString()}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Wallet credits apply automatically to new invoices. Contact support to top up.
            </p>
          </div>
          <div className="card">
            <div className="mb-2 text-sm font-semibold text-slate-800">Recent wallet activity</div>
            {(!wallet?.transactions || wallet.transactions.length === 0) && (
              <div className="text-xs text-slate-500">No wallet activity yet.</div>
            )}
            <ul className="divide-y divide-slate-100">
              {wallet?.transactions?.slice(0, 8).map((t) => (
                <li key={t._id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className={t.type === 'credit' ? 'text-green-700' : 'text-yellow-700'}>
                      {t.type === 'credit' ? '+' : '−'} ৳ {t.amount}
                    </div>
                    <div className="text-xs text-slate-500">{t.reason}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
