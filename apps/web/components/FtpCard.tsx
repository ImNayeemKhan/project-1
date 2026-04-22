import type { FtpServerRow } from '@/lib/ftp';
import { MirrorStatus } from './MirrorStatus';

const accessBadge: Record<FtpServerRow['accessLevel'], { label: string; tone: string }> = {
  public: { label: 'Open to all', tone: 'bg-green-100 text-green-800' },
  customer: { label: 'All active customers', tone: 'bg-brand-100 text-brand-800' },
  business: { label: 'Business plans', tone: 'bg-amber-100 text-amber-800' },
  partner: { label: 'Partners only', tone: 'bg-slate-200 text-slate-800' },
};

export function FtpCard({ server }: { server: FtpServerRow }) {
  const access = accessBadge[server.accessLevel];
  return (
    <article className="card group flex flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      {server.imageUrl && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={server.imageUrl}
            alt={server.name}
            className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3">
            <MirrorStatus host={server.host} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{server.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${access.tone}`}>
            {access.label}
          </span>
        </div>
        {server.tagline && <p className="mt-1 text-sm text-slate-600">{server.tagline}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Host</dt>
          <dd className="truncate text-right font-mono text-xs text-slate-800">{server.host}</dd>
          <dt className="text-slate-500">Protocol</dt>
          <dd className="text-right text-slate-800">{server.protocol.toUpperCase()}</dd>
          <dt className="text-slate-500">Capacity</dt>
          <dd className="text-right text-slate-800">{server.capacityTB} TB</dd>
          <dt className="text-slate-500">Peak speed</dt>
          <dd className="text-right text-slate-800">{server.maxSpeedMbps} Mbps</dd>
        </dl>
        {server.contentTypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {server.contentTypes.map((c) => (
              <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {c}
              </span>
            ))}
          </div>
        )}
        {server.features.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-slate-700">
            {server.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-600">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
