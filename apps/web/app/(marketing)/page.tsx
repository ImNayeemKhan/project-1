import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${BRAND.name} — Fiber internet for homes, gamers, and corporates`,
  description:
    `${BRAND.name} delivers fiber-to-the-home, gaming, and corporate internet across Dhaka. ` +
    '24/7 local support, online bKash payment, BDIX entertainment mirrors, and transparent pricing.',
};

const HERO_IMG =
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=80';

const features = [
  {
    title: 'Fiber-to-the-home',
    body: 'Dedicated fiber drop to your home or office — no shared medium, no throttling, symmetric upload on business plans.',
    img: 'https://images.unsplash.com/photo-1573164574472-797cdf4a583a?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: '24/7 local support',
    body: 'Our NOC watches every link around the clock. Call, WhatsApp, or raise a ticket from the portal.',
    img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Online bill + bKash',
    body: 'Pay in seconds from the customer portal. Auto-invoicing, receipts, and reconnect — no field visits.',
    img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Business-grade SLA',
    body: 'Static IPs, 99.9% uptime, dedicated account manager, and priority ticket response for business plans.',
    img: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&w=900&q=80',
  },
];

interface PackagePreview {
  _id: string;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  downloadMbps: number;
  uploadMbps: number;
  imageUrl?: string;
  isFeatured?: boolean;
}

async function getFeaturedPackages(): Promise<PackagePreview[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  try {
    const res = await fetch(`${apiBase}/api/public/packages`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items as PackagePreview[]).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const packages = await getFeaturedPackages();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMG}
          alt="Fiber optic cables glowing blue in a data center"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-brand-700/70" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            Fiber-grade internet
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            Internet deals — backed by 99.9% reliability.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">
            Do more of what you love and keep the whole house connected. {BRAND.name} delivers
            fiber-to-the-home, gaming, and corporate plans across Dhaka with 24/7 local support
            and online bKash payment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/packages" className="btn-primary">
              See packages
            </Link>
            <Link
              href="/contact"
              className="btn border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              Get connected
            </Link>
          </div>
          <div className="mt-10 grid max-w-3xl grid-cols-2 gap-6 text-white md:grid-cols-4">
            <Stat value="99.9%" label="Uptime SLA" />
            <Stat value="24/7" label="NOC support" />
            <Stat value="Fiber" label="FTTH core" />
            <Stat value="BDIX" label="Entertainment mirrors" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Built for real homes and real businesses</h2>
          <p className="mt-2 text-slate-600">
            No hidden fees, no artificial speed caps, and a billing system you can check from your phone.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="card flex gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.img}
                alt={f.title}
                className="hidden h-24 w-32 rounded-md object-cover sm:block"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages preview */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Popular packages</h2>
              <p className="mt-2 text-slate-600">Pick a plan — we&apos;ll handle the rest.</p>
            </div>
            <Link href="/packages" className="text-sm font-semibold text-brand-600 hover:underline">
              View all packages →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {packages.length > 0 ? (
              packages.map((p) => (
                <PackageCard key={p._id} pkg={p} />
              ))
            ) : (
              <p className="col-span-3 text-center text-slate-500">
                Packages will appear here once the API is available.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-10 py-14 text-white shadow-lg">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-bold">Ready to get connected?</h3>
              <p className="mt-1 text-white/90">
                Drop us your address and we&apos;ll confirm coverage and install within 24–48 hours.
              </p>
            </div>
            <Link
              href="/contact"
              className="btn bg-white text-brand-700 hover:bg-slate-100"
            >
              Request a connection
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackagePreview }) {
  return (
    <div className="card flex flex-col overflow-hidden p-0">
      {pkg.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pkg.imageUrl} alt={pkg.name} className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-slate-900">{pkg.name}</h4>
          {pkg.isFeatured && <span className="badge-green">Popular</span>}
        </div>
        {pkg.tagline && <p className="mt-1 text-sm text-slate-600">{pkg.tagline}</p>}
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">৳{pkg.monthlyPrice}</span>
          <span className="text-sm text-slate-500">/ month</span>
        </div>
        <div className="mt-3 text-sm text-slate-600">
          {pkg.downloadMbps} ↓ / {pkg.uploadMbps} ↑ Mbps
        </div>
        <div className="mt-5">
          <Link href="/contact" className="btn-primary w-full justify-center">
            Get this plan
          </Link>
        </div>
      </div>
    </div>
  );
}
