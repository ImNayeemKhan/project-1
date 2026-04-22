import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import type { PackageRow } from '@/components/PackageFilterGrid';
import { PremiumPlanGrid } from '@/components/PremiumPlanGrid';
import { PricingComparisonTable } from '@/components/PricingComparisonTable';
import { PlanQuiz } from '@/components/PlanQuiz';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { ProductListJsonLd } from '@/components/StructuredData';
import {
  Button,
  Card,
  Container,
  Section,
  SectionHeading,
} from '@/components/ui';

/**
 * /packages — redesigned under the 5-step workflow.
 *
 *   STEP 1 (locked): primary goal = plan selection, secondary = add-on
 *          attach. One brand-filled CTA per card ("Pick this plan").
 *   STEP 2: Intro · toggles · plan grid · compare table · plan quiz +
 *          savings calculator · FAQ-style add-ons · final CTA.
 *   STEP 3: Recommended-plan badge shifts mix upward; billing-cycle
 *          toggle exposes real savings; currency toggle removes "is this
 *          USD?" friction for expat visitors.
 *   STEP 4: Server component (SEO-clean pricing for crawlers) wrapping a
 *          client-side grid component for the interactive toggles.
 */

export const metadata: Metadata = {
  title: `Packages — ${BRAND.name}`,
  description:
    `${BRAND.name} residential and business fiber packages. Transparent pricing ` +
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

const ADDONS = [
  {
    name: 'Static IPv4',
    price: 500,
    body: 'Dedicated public IP for hosting, VPN endpoints, CCTV, or remote desktop.',
  },
  {
    name: 'IPTV bundle',
    price: 300,
    body: '200+ SD/HD local and regional TV channels on any device in your household.',
  },
  {
    name: 'Managed Wi-Fi',
    price: 400,
    body: 'Pre-configured dual-band router, mesh extender, and on-site tune-up.',
  },
  {
    name: 'Cloud backup',
    price: 600,
    body: '100 GB encrypted backup to our BDIX-hosted object storage, daily snapshots.',
  },
];

export default async function PackagesPage() {
  const packages = await getPackages();

  if (packages.length === 0) {
    return (
      <Section variant="canvas">
        <Container>
          <Card variant="flat" className="p-12 text-center text-muted">
            Packages are temporarily unavailable. Please try again in a moment.
          </Card>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <ProductListJsonLd packages={packages} />

      <PremiumPlanGrid packages={packages} />

      {/* Side-by-side compare (existing component, retained) */}
      <Section variant="surface">
        <Container>
          <SectionHeading
            eyebrow="Compare"
            title="Side-by-side comparison."
            body="Every feature, every speed, every FUP tier — on one page."
          />
          <div className="mt-10">
            <PricingComparisonTable packages={packages} />
          </div>
        </Container>
      </Section>

      {/* Decision helpers */}
      <Section variant="canvas">
        <Container>
          <SectionHeading
            eyebrow="Not sure?"
            title="Answer 4 quick questions or run the savings calculator."
            body="Both take under a minute and recommend the right plan for your household."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
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
          </div>
        </Container>
      </Section>

      {/* Add-ons */}
      <Section variant="surface">
        <Container>
          <SectionHeading
            eyebrow="Add-ons"
            title="Stack exactly what you need."
            body="Static IP, IPTV, managed Wi-Fi, cloud backup — attach to any plan at checkout or later from the portal."
          />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ADDONS.map((a) => (
              <Card key={a.name} variant="flat" className="h-full">
                <div className="flex h-full flex-col">
                  <div className="text-[15px] font-semibold text-primary">{a.name}</div>
                  <p className="mt-2 text-[14px] leading-[1.55] text-secondary">{a.body}</p>
                  <div className="mt-4 flex items-baseline gap-1 text-primary">
                    <span className="text-[20px] font-semibold tabular-nums">
                      ৳{a.price.toLocaleString('en-BD')}
                    </span>
                    <span className="text-[12px] font-medium text-muted">/mo</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section variant="canvas" tight>
        <Container>
          <Card variant="elevated" className="overflow-hidden p-0">
            <div className="flex flex-col items-start gap-6 p-10 md:flex-row md:items-center md:justify-between md:p-12">
              <div className="max-w-[520px]">
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Still comparing?
                </div>
                <h3 className="mt-2 text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-primary md:text-[28px]">
                  Talk to sales — we&apos;ll recommend the right plan for your address in under 2 minutes.
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button href="/contact" variant="primary" size="lg">
                  Get connected
                </Button>
                <Button href={BRAND.primaryPhoneHref} variant="secondary" size="lg">
                  Call {BRAND.primaryPhone}
                </Button>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
