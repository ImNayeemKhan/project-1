'use client';
import useSWR from 'swr';

interface FtpServer {
  _id: string;
  name: string;
  code: string;
  category: 'entertainment' | 'carrier' | 'business' | 'partnership';
  tagline?: string;
  host: string;
  webUrl?: string;
  port: number;
  protocol: string;
  accessLevel: string;
  capacityTB: number;
  maxSpeedMbps: number;
  contentTypes: string[];
  features: string[];
  imageUrl?: string;
}

const groupLabel: Record<FtpServer['category'], string> = {
  entertainment: 'Entertainment',
  carrier: 'Carrier',
  business: 'Business',
  partnership: 'Partnership',
};

export default function CustomerFtpPage() {
  const { data, isLoading } = useSWR<{ accessLevels: string[]; items: FtpServer[] }>(
    '/api/customer/ftp'
  );

  const grouped: Record<string, FtpServer[]> = {};
  for (const s of data?.items ?? []) {
    grouped[s.category] ??= [];
    grouped[s.category].push(s);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">FTP &amp; mirror servers</h1>
        <p className="mt-1 text-sm text-slate-600">
          These are mirrors and file servers you have access to today. Downloads from these run at
          your full line speed and don&apos;t count against your FUP.
        </p>
        {data?.accessLevels && (
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {data.accessLevels.map((lvl) => (
              <span key={lvl} className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-800">
                {lvl} tier
              </span>
            ))}
          </div>
        )}
      </div>

      {isLoading && <div className="card">Loading…</div>}
      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <div className="card text-slate-600">
          You don&apos;t have access to any mirror servers yet. Activate a subscription from your
          account to unlock customer-tier mirrors.
        </div>
      )}

      {(['entertainment', 'business', 'carrier', 'partnership'] as const).map((cat) =>
        grouped[cat]?.length ? (
          <section key={cat}>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">{groupLabel[cat]}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {grouped[cat].map((s) => (
                <article key={s._id} className="card overflow-hidden p-0">
                  {s.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt={s.name} className="h-32 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {s.protocol.toUpperCase()}:{s.port}
                      </span>
                    </div>
                    {s.tagline && <p className="mt-1 text-xs text-slate-600">{s.tagline}</p>}
                    <div className="mt-3 space-y-1 text-sm">
                      <div>
                        <span className="text-slate-500">Host: </span>
                        <span className="font-mono text-xs">{s.host}</span>
                      </div>
                      {s.webUrl && (
                        <a
                          href={s.webUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sm text-brand-600 hover:underline"
                        >
                          Open in browser →
                        </a>
                      )}
                    </div>
                    {s.contentTypes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {s.contentTypes.map((c) => (
                          <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}
