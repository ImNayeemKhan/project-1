'use client';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Invoice {
  _id: string;
  invoiceNo: string;
  amount: number;
  currency: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'void';
  dueDate: string;
  customer: { _id: string; name: string; email: string };
  subscription: { pppoeUsername: string };
}

export default function InvoicesPage() {
  const { data, isLoading } = useSWR<{ items: Invoice[] }>('/api/admin/invoices');

  const markPaid = async (id: string) => {
    try {
      await api.post(`/api/admin/invoices/${id}/mark-paid`, { reference: 'manual-admin' });
      mutate('/api/admin/invoices');
    } catch (e) {
      alert(extractError(e));
    }
  };

  const runBilling = async () => {
    try {
      const { data } = await api.post('/api/admin/invoices/run-billing');
      alert(`Billing run complete — created ${data.invoicesCreated}, suspended ${data.suspended}`);
      mutate('/api/admin/invoices');
    } catch (e) {
      alert(extractError(e));
    }
  };

  const tone = (s: Invoice['status']) =>
    s === 'paid' ? 'badge-green' : s === 'overdue' ? 'badge-red' : s === 'void' ? 'badge-slate' : 'badge-yellow';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
        <button onClick={runBilling} className="btn-secondary">Run billing cycle now</button>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Customer</th>
              <th className="table-th">PPPoE</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Due</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="table-td" colSpan={7}>Loading…</td></tr>}
            {data?.items?.map((i) => (
              <tr key={i._id}>
                <td className="table-td font-mono text-xs">{i.invoiceNo}</td>
                <td className="table-td">{i.customer?.name}</td>
                <td className="table-td font-mono text-xs">{i.subscription?.pppoeUsername}</td>
                <td className="table-td">{i.currency} {i.amount.toLocaleString()}</td>
                <td className="table-td">{new Date(i.dueDate).toLocaleDateString()}</td>
                <td className="table-td"><span className={tone(i.status)}>{i.status}</span></td>
                <td className="table-td">
                  {i.status !== 'paid' && (
                    <button className="text-xs text-brand-600 hover:underline" onClick={() => markPaid(i._id)}>Mark paid</button>
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
