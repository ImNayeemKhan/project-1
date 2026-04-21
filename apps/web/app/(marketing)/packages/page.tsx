import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PackageFilterGrid, type PackageRow } from '@/components/PackageFilterGrid';
import { PricingComparisonTable } from '@/components/PricingComparisonTable';
import { PlanQuiz } from '@/components/PlanQuiz';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { ProductListJsonLd } from '@/components/StructuredData';

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
        <>
          <ProductListJsonLd packages={packages} />
          <PackageFilterGrid packages={packages} />
          <section className="mt-16">
            <PricingComparisonTable packages={packages} />
          </section>
          <section className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PlanQuiz packages={packages} />
            </div>
            <div className="lg:col-span-2">
              <SavingsCalculator
                defaultCurrent={1800}
                defaultTarget={packages[0]?.monthlyPrice ?? 1200}
                targetFupGB={packages[0]?.fupGB}
                targetName={packages[0]?.name ?? 'the starter plan'}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
