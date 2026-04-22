'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, extractError } from '@/lib/api';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  audience: 'all' | 'active' | 'suspended' | 'admins';
  severity: 'info' | 'warning' | 'critical';
  isPinned: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

const severityTone: Record<Announcement['severity'], string> = {
  info: 'badge-slate',
  warning: 'badge-yellow',
  critical: 'badge-red',
};

export default function AdminAnnouncementsPage() {
  const { data, isLoading } = useSWR<{ items: Announcement[] }>('/api/admin/announcements');
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'all' as Announcement['audience'],
    severity: 'info' as Announcement['severity'],
    isPinned: false,
  });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/api/admin/announcements', form);
      setForm({ title: '', body: '', audience: 'all', severity: 'info', isPinned: false });
      mutate('/api/admin/announcements');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      mutate('/api/admin/announcements');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>

      <form onSubmit={submit} className="card space-y-3">
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea
          className="input min-h-[100px]"
          placeholder="Message body"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Announcement['audience'] })}>
            <option value="all">All customers</option>
            <option value="active">Active only</option>
            <option value="suspended">Suspended only</option>
            <option value="admins">Admins</option>
          </select>
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Announcement['severity'] })}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
            Pin to top
          </label>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary">Publish</button>
      </form>

      <div className="space-y-3">
        {isLoading && <div className="text-slate-500">Loading…</div>}
        {data?.items?.map((a) => (
          <div key={a._id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{a.title}</h3>
                  <span className={severityTone[a.severity]}>{a.severity}</span>
                  {a.isPinned && <span className="badge-green">pinned</span>}
                </div>
                <div className="text-xs text-slate-500">
                  Audience: {a.audience} · Published {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : '—'}
                </div>
              </div>
              <button onClick={() => remove(a._id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
