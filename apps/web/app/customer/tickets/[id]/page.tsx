'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Message {
  _id?: string;
  author: { _id: string; name: string };
  authorRole: 'admin' | 'reseller' | 'customer';
  body: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  ticketNo: string;
  subject: string;
  status: string;
  category: string;
  priority: string;
  messages: Message[];
  createdAt: string;
}

export default function CustomerTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const key = `/api/customer/tickets/${id}`;
  const { data, isLoading } = useSWR<{ ticket: Ticket }>(key);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await api.post(`/api/customer/tickets/${id}/reply`, { body });
      setBody('');
      mutate(key);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !data) return <div className="text-slate-500">Loading…</div>;
  const t = data.ticket;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.subject}</h1>
        <div className="mt-1 text-sm text-slate-500">
          <span className="font-mono">{t.ticketNo}</span> · {t.category} · priority {t.priority} · status {t.status}
        </div>
      </div>

      <div className="space-y-3">
        {t.messages.map((m, i) => (
          <div key={m._id ?? i} className={`card ${m.authorRole !== 'customer' ? 'bg-brand-50 border-brand-100' : ''}`}>
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">{m.author?.name ?? m.authorRole}</span> · {m.authorRole} · {new Date(m.createdAt).toLocaleString()}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{m.body}</div>
          </div>
        ))}
      </div>

      {t.status !== 'closed' && (
        <form onSubmit={reply} className="card space-y-3">
          <label className="block text-sm font-medium text-slate-700">Reply</label>
          <textarea className="input min-h-[120px]" value={body} onChange={(e) => setBody(e.target.value)} required />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send reply'}</button>
        </form>
      )}
    </div>
  );
}
