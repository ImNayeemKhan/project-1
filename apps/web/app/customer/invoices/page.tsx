'use client';
import useSWR from 'swr';
import { api, extractError } from '@/lib/api';

interface Invoice {
  _id: string;
  invoiceNo: string;
  amount: number;
  currency: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'void';
  dueDate: string;
  subscription: { pppoeUsername: string };
}

export default function CustomerInvoices() {
  const { data, isLoading } = useSWR<{ items: Invoice[] }>('/api/customer/invoices');

  const pay = async (id: string) => {
    try {
      const { data } = await api.post('/api/payments/bkash/init', { invoiceId: id });
      // Redirect to bKash (real) or to our mock callback.
      window.location.href = data.bkashURL;
    } catch (e) {
      alert(extractError(e));
    }
  };

  const tone = (s: Invoice['status']) =>
    s === 'paid' ? 'badge-green' : s === 'overdue' ? 'badge-red' : s === 'void' ? 'badge-slate' : 'badge-yellow';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Due</th>
              <th className="table-th">Status</th>
              <th className="table-th">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={5}>Loading…</td></tr>}
            {data?.items?.length === 0 && (
              <tr><td className="table-td text-slate-500" colSpan={5}>No invoices yet.</td></tr>
            )}
            {data?.items?.map((i) => (
              <tr key={i._id}>
                <td className="table-td font-mono text-xs">{i.invoiceNo}</td>
                <td className="table-td">{i.currency} {i.amount.toLocaleString()}</td>
                <td className="table-td">{new Date(i.dueDate).toLocaleDateString()}</td>
                <td className="table-td"><span className={tone(i.status)}>{i.status}</span></td>
                <td className="table-td">
                  {i.status !== 'paid' && (
                    <button className="btn-primary !px-3 !py-1 text-xs" onClick={() => pay(i._id)}>Pay with bKash</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
