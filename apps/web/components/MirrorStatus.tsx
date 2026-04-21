'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface MirrorStatusItem {
  host: string;
  state: 'online' | 'degraded' | 'down';
  latencyMs: number;
  updatedAt: string;
}

export function MirrorStatus({ host, initial }: { host: string; initial?: MirrorStatusItem }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  const { data } = useSWR<MirrorStatusItem>(
    `${apiBase}/api/public/ftp-status?host=${encodeURIComponent(host)}`,
    fetcher,
    { refreshInterval: 30_000, fallbackData: initial, revalidateOnFocus: false }
  );

  const state = data?.state ?? 'online';
  const color =
    state === 'online'
      ? 'bg-green-100 text-green-800 ring-green-200'
      : state === 'degraded'
      ? 'bg-yellow-100 text-yellow-800 ring-yellow-200'
      : 'bg-red-100 text-red-800 ring-red-200';
  const dot =
    state === 'online' ? 'bg-green-500' : state === 'degraded' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot} ${state === 'online' ? 'animate-pulse' : ''}`} />
      {state}
      {data?.latencyMs != null && state === 'online' && (
        <span className="ml-1 font-mono text-[10px] text-slate-500">{data.latencyMs}ms</span>
      )}
    </span>
  );
}
