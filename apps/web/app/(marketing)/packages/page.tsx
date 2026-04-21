import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Packages — ISP Platform',
  description: 'Home and business fiber internet packages. Transparent pricing, no hidden fees.',
};

interface PackageRow {
  _id: string;
  name: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  downloadMbps: number;
  uploadMbps: number;
  monthlyPrice: number;
  setupFee: number;
  fupGB?: number;
  features: string[];
  isFeatured?: boolean;
}

async function getPackages(): Promise<PackageRow[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  try {
    const res = await fetch(`${apiBase}/api/public/packages`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items as PackageRow[];
  } catch {
    return [];
  }
}

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Packages</h1>
        <p className="mt-3 text-slate-600">
          All plans include free installation, 24/7 support, and online bill payment.
        </p>
      </div>

      {packages.length === 0 ? (
        <p className="text-center text-slate-500">
          Packages are temporarily unavailable. Please try again in a moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <article
              key={pkg._id}
              className={`card flex flex-col overflow-hidden p-0 ${
                pkg.isFeatured ? 'ring-2 ring-brand-500' : ''
              }`}
            >
              {pkg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.imageUrl} alt={pkg.name} className="h-44 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">{pkg.name}</h3>
                  {pkg.isFeatured && <span className="badge-green">Popular</span>}
                </div>
                {pkg.tagline && <p className="mt-1 text-sm text-slate-600">{pkg.tagline}</p>}

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">৳{pkg.monthlyPrice}</span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-slate-500">Download</dt>
                  <dd className="text-right font-medium text-slate-800">{pkg.downloadMbps} Mbps</dd>
                  <dt className="text-slate-500">Upload</dt>
                  <dd className="text-right font-medium text-slate-800">{pkg.uploadMbps} Mbps</dd>
                  {typeof pkg.fupGB === 'number' && (
                    <>
                      <dt className="text-slate-500">FUP</dt>
                      <dd className="text-right font-medium text-slate-800">{pkg.fupGB} GB</dd>
                    </>
                  )}
                  <dt className="text-slate-500">Setup fee</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {pkg.setupFee > 0 ? `৳${pkg.setupFee}` : 'Free'}
                  </dd>
                </dl>

                {pkg.features?.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 text-brand-600">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6">
                  <Link href={`/contact?plan=${pkg._id}`} className="btn-primary w-full justify-center">
                    Get {pkg.name}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
