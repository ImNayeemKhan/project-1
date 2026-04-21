import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PackageFilterGrid, type PackageRow } from '@/components/PackageFilterGrid';

export const metadata: Metadata = {
  title: `Packages — ${BRAND.name}`,
  description:
    `${BRAND.name} personal, gaming, and corporate fiber packages. Transparent pricing ` +
    '(including 5% VAT), unlimited BDIX, and free installation on select plans.',
};

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
          All plans include free installation, 24/7 support, and online bill payment. Filter by
          family or drag the speed slider to narrow down.
        </p>
      </div>

      {packages.length === 0 ? (
        <p className="text-center text-slate-500">
          Packages are temporarily unavailable. Please try again in a moment.
        </p>
      ) : (
        <PackageFilterGrid packages={packages} />
      )}
    </div>
  );
}
