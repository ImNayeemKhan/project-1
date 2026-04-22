'use client';
import useSWR from 'swr';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  isPinned: boolean;
  publishedAt?: string;
}

const severityTone: Record<Announcement['severity'], string> = {
  info: 'badge-slate',
  warning: 'badge-yellow',
  critical: 'badge-red',
};

export default function CustomerAnnouncementsPage() {
  const { data, isLoading } = useSWR<{ items: Announcement[] }>('/api/customer/announcements');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
      {isLoading && <div className="text-slate-500">Loading…</div>}
      {data?.items?.length === 0 && <div className="card text-slate-500">No announcements right now.</div>}
      <div className="space-y-3">
        {data?.items?.map((a) => (
          <div key={a._id} className="card">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{a.title}</h2>
              <span className={severityTone[a.severity]}>{a.severity}</span>
              {a.isPinned && <span className="badge-green">pinned</span>}
            </div>
            <div className="text-xs text-slate-500">
              {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
