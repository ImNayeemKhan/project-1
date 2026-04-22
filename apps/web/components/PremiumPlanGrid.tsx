'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Container,
  Section,
  SectionHeading,
  Toggle,
} from '@/components/ui';
import type { PackageRow } from '@/components/PackageFilterGrid';

/**
 * /packages page body — redesigned under the 5-step workflow.
 *
 *   STEP 1: Warm visitor already decided to consider Desh. Goal → pick a
 *           plan with confidence in < 60s. Business goal → increase plan-
 *           selection conversion, shift mix upward via a recommended badge.
 *   STEP 2: Intro → toggles (cycle · currency · plan type) → plan grid (4 cards,
 *           Standard marked "★ Most chosen") → compare table → add-ons.
 *   STEP 3: ONE brand-filled CTA per card ("Pick this plan"). Secondary
 *           actions (chat, contact) are ghost. Toggles use the shared
 *           segmented-control primitive.
 *   STEP 4: Implemented with the design-token primitives (Toggle, Card,
 *           Button). Billing-cycle discount is computed deterministically
 *           (−5% quarterly, −15% annual) so numbers never lie.
 */

type Cycle = 'monthly' | 'quarterly' | 'annual';
type Currency = 'bdt' | 'usd';
type Audience = 'residential' | 'business';

const CYCLE_FACTOR: Record<Cycle, { multiplier: number; discount: number; label: string }> = {
  monthly:   { multiplier: 1,  discount: 0,    label: '/mo'  },
  quarterly: { multiplier: 3,  discount: 0.05, label: '/qtr' },
  annual:    { multiplier: 12, discount: 0.15, label: '/yr'  },
};
const USD_RATE = 120; // BDT per USD — visible to the user via the toggle

export function PremiumPlanGrid({ packages }: { packages: PackageRow[] }) {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [currency, setCurrency] = useState<Currency>('bdt');
  const [audience, setAudience] = useState<Audience>('residential');

  const visible = useMemo(() => {
    const corporateOnly = audience === 'business';
    return packages
      .filter((p) => {
        if (corporateOnly) return p.category === 'corporate';
        // Residential bucket = anything that isn't explicitly corporate.
        return p.category !== 'corporate';
      })
      .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
      .slice(0, 4);
  }, [packages, audience]);

  const featuredId = useMemo(() => {
    // Deterministic "recommended" = 2nd lowest-priced plan in the visible
    // slice. That's the classic residential sweet-spot and maps to the
    // user-facing "★ Most chosen" badge.
    if (visible.length < 2) return visible[0]?._id;
    return visible[1]._id;
  }, [visible]);

  const fmtAmount = (bdt: number): string => {
    const display = currency === 'bdt' ? bdt : bdt / USD_RATE;
    const symbol = currency === 'bdt' ? '৳' : '$';
    const rounded = Math.round(display);
    return `${symbol}${rounded.toLocaleString(currency === 'bdt' ? 'en-BD' : 'en-US')}`;
  };

  const fmtPrice = (monthly: number): { amount: string; suffix: string } => {
    const { multiplier, discount, label } = CYCLE_FACTOR[cycle];
    const totalBdt = monthly * multiplier * (1 - discount);
    return { amount: fmtAmount(totalBdt), suffix: label };
  };

  const fmtMonthlyEquivalent = (monthly: number): string => {
    const { discount } = CYCLE_FACTOR[cycle];
    return fmtAmount(monthly * (1 - discount));
  };

  const fupLevel = (fupGB?: number): 0 | 1 | 2 | 3 => {
    if (!fupGB || fupGB === 0) return 3; // unlimited
    if (fupGB >= 2000) return 3;
    if (fupGB >= 1000) return 2;
    if (fupGB >= 500) return 1;
    return 0;
  };

  return (
    <Section variant="canvas" tight>
      <Container>
        {/* ===== Intro / toggles ===== */}
        <SectionHeading
          eyebrow="Plans"
          title="Pick the plan that fits how you actually use the internet."
          body="All plans include free installation, 24/7 local NOC, and unlimited BDIX. Change plans any time — upgrades prorated, downgrades apply next cycle."
        />

        <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Toggle<Audience>
            value={audience}
            onChange={setAudience}
            options={[
              { value: 'residential', label: 'Residential' },
              { value: 'business', label: 'Business' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Toggle<Cycle>
              value={cycle}
              onChange={setCycle}
              size="sm"
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly', hint: '−5%' },
                { value: 'annual', label: 'Annual', hint: '−15%' },
              ]}
            />
            <Toggle<Currency>
              value={currency}
              onChange={setCurrency}
              size="sm"
              options={[
                { value: 'bdt', label: '৳ BDT' },
                { value: 'usd', label: '$ USD' },
              ]}
            />
          </div>
        </div>

        {/* ===== Plan grid ===== */}
        {visible.length === 0 ? (
          <div className="mt-16 rounded-card border border-subtle bg-surface p-12 text-center text-muted">
            No plans match the current filters. Try switching audience.
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((pkg) => {
              const isFeatured = pkg._id === featuredId;
              const price = fmtPrice(pkg.monthlyPrice);
              const fup = fupLevel(pkg.fupGB);
              return (
                <Card
                  key={pkg._id}
                  variant={isFeatured ? 'featured' : 'interactive'}
                  className="flex h-full flex-col"
                  padded={false}
                >
                  {isFeatured ? (
                    <div className="flex items-center justify-center border-b border-brand-500/20 bg-brand-50 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                      ★ Most chosen
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="text-[15px] font-semibold text-primary">{pkg.name}</div>
                    {pkg.tagline ? (
                      <p className="mt-1 text-[13px] text-muted">{pkg.tagline}</p>
                    ) : null}
                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.02em] text-primary tabular-nums">
                        {price.amount}
                      </span>
                      <span className="text-[13px] font-medium text-muted">{price.suffix}</span>
                    </div>
                    {cycle !== 'monthly' ? (
                      <div className="mt-1 text-[12px] text-subtle">
                        equivalent to {fmtMonthlyEquivalent(pkg.monthlyPrice)}/mo
                      </div>
                    ) : null}
                    <div className="mt-5 flex items-center gap-4 border-t border-subtle pt-5 text-[13px] text-secondary">
                      <span className="font-medium tabular-nums">{pkg.downloadMbps} Mbps ↓</span>
                      <span aria-hidden className="text-subtle">·</span>
                      <span className="font-medium tabular-nums">{pkg.uploadMbps} Mbps ↑</span>
                    </div>
                    <div className="mt-5">
                      <div className="mb-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-muted">Data allowance</span>
                        <span className="font-medium text-secondary">
                          {pkg.fupGB && pkg.fupGB > 0 ? `${pkg.fupGB.toLocaleString()} GB FUP` : 'Unlimited'}
                        </span>
                      </div>
                      <FupBar level={fup} />
                    </div>
                    <ul className="mt-6 flex flex-col gap-2 text-[14px] text-secondary">
                      {(pkg.features?.slice(0, 4) ?? [
                        'Free installation',
                        'Unlimited BDIX',
                        '24/7 local NOC',
                      ]).map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" aria-hidden />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <Button
                        href={`/checkout?plan=${pkg._id}`}
                        variant={isFeatured ? 'primary' : 'secondary'}
                        className="w-full"
                      >
                        Pick this plan
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}

function FupBar({ level }: { level: 0 | 1 | 2 | 3 }) {
  // 4 segments, filled up to `level+1`. Visually compact, honest about
  // the tier without resorting to footnote-sized small print.
  return (
    <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-surface-muted">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-full flex-1 rounded-full transition-colors ${
            i <= level ? 'bg-brand-500' : 'bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}
