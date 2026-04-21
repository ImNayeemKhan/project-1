'use client';

import { useEffect, useState } from 'react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar?: string;
  stars?: number;
}

const DEFAULT: Testimonial[] = [
  {
    name: 'Tasnim R.',
    role: 'Software engineer · Dhanmondi',
    quote:
      'Switched from my old ISP and the difference is night and day. Zero lag on calls, and bKash billing works without calling anyone.',
    avatar: 'https://i.pravatar.cc/80?img=47',
    stars: 5,
  },
  {
    name: 'Sakib H.',
    role: 'Esports streamer · Uttara',
    quote:
      'Pings to AWS Singapore dropped from 90ms to 38ms. This is genuinely the best gaming line in the city.',
    avatar: 'https://i.pravatar.cc/80?img=12',
    stars: 5,
  },
  {
    name: 'Nusrat A.',
    role: 'Ecommerce founder · Bashundhara',
    quote:
      'We run four Shopify stores from our office. Since moving to the corporate plan, outages are basically a non-issue.',
    avatar: 'https://i.pravatar.cc/80?img=32',
    stars: 5,
  },
  {
    name: 'Rezaul K.',
    role: 'Family of 5 · Mirpur DOHS',
    quote:
      'Everyone streams at once — nobody complains anymore. Installation was same-day, support picks up in two rings.',
    avatar: 'https://i.pravatar.cc/80?img=8',
    stars: 5,
  },
];

export function TestimonialCarousel({
  items = DEFAULT,
  intervalMs = 6500,
}: {
  items?: Testimonial[];
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs, paused]);

  const t = items[idx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex items-start gap-4">
        {t.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.avatar}
            alt={t.name}
            className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <Stars n={t.stars ?? 5} />
          <blockquote className="mt-2 text-lg leading-relaxed text-slate-800">
            “{t.quote}”
          </blockquote>
          <div className="mt-3 text-sm font-semibold text-slate-900">{t.name}</div>
          <div className="text-xs text-slate-500">{t.role}</div>
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Show testimonial ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < n ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}
