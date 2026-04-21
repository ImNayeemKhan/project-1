'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, extractError } from '@/lib/api';

type Category = 'connection' | 'billing' | 'installation' | 'upgrade' | 'cancellation' | 'other';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Category>('connection');
  const [priority, setPriority] = useState<Priority>('normal');
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await api.post('/api/customer/tickets', { subject, category, priority, body });
      router.push(`/customer/tickets/${res.data.ticket._id}`);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">New support ticket</h1>
      <form onSubmit={submit} className="card space-y-3">
        <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            <option value="connection">Connection</option>
            <option value="billing">Billing</option>
            <option value="installation">Installation</option>
            <option value="upgrade">Upgrade</option>
            <option value="cancellation">Cancellation</option>
            <option value="other">Other</option>
          </select>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <textarea
          className="input min-h-[160px]"
          placeholder="Describe the issue in detail…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit ticket'}
        </button>
      </form>
    </div>
  );
}
