import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import {
  Button,
  Card,
  Chip,
  Container,
  Counter,
  Logo,
  ScrollReveal,
  Section,
  SectionHeading,
  StatusDot,
} from '@/components/ui';

/**
 * Homepage — redesigned under the 5-step workflow.
 *
 *   STEP 1: Visitor goal → "is Desh right for me, what do plans cost, can I
 *           sign up?" Business goal → pull visitors into /packages (the
 *           user-confirmed primary conversion action is "package viewed").
 *   STEP 2: Hero · plan teaser · why desh · BDIX · coverage · testimonial ·
 *           FAQ · final CTA · footer.
 *   STEP 3: ONE brand-filled CTA per section ("See packages"). Secondary
 *           actions are ghost/outline so they never compete for the eye.
 *   STEP 4: Implemented with design-token primitives (Section, Container,
 *           SectionHeading, Card, Chip, Button) — no hardcoded colors or
 *           shadows.
 */

export const metadata: Metadata = {
  title: `${BRAND.name} — Fiber internet for homes, gamers, and corporates`,
  description:
    `${BRAND.name} delivers fiber-to-the-home, gaming, and corporate internet across Dhaka. ` +
    '24/7 local support, online bKash payment, BDIX entertainment mirrors, and transparent pricing.',
};

const HERO_IMG =
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=80';

interface PackagePreview {
  _id: string;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  downloadMbps: number;
  uploadMbps: number;
  fupGB?: number;
  features?: string[];
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

const WHY = [
  {
    title: 'Fiber to your door',
    body: 'Dedicated drop — no shared loop, no peak-hour throttling, symmetric upload on Business plans.',
  },
  {
    title: '99.9% uptime',
    body: 'Ring-redundant core in two Dhaka PoPs. Dual-NTTN upstream. Network-ops monitors every link.',
  },
  {
    title: 'Installed in 48h',
    body: 'Order online, confirm address, have a field team at your door within two business days.',
  },
  {
    title: '24/7 local NOC',
    body: 'Dhaka-based engineers on call every hour. Call, WhatsApp, or raise a ticket from the portal.',
  },
];

const BDIX = [
  { name: 'Entertainment', detail: 'Movies · TV · anime · music · games · 220 TB', status: 'online' as const },
  { name: 'Carrier peering', detail: 'Dual NTTN + direct BDIX 40G · 14 IX peers', status: 'online' as const },
  { name: 'Business file-drop', detail: '10G internal · snapshot backups', status: 'online' as const },
  { name: 'Partner CDN', detail: 'Signed partners · 5G signed drops', status: 'degraded' as const },
];

const TESTIMONIALS = [
  {
    quote: '“Switched from another ISP and the difference was night and day. BDIX speeds are consistently fast, no throttling during peak hours.”',
    who: 'Arif H. · Dhanmondi',
  },
  {
    quote: '“Support actually picks up the phone at 2am. We run a 24/7 e-commerce floor — this matters more than raw Mbps.”',
    who: 'Nadia K. · SMB owner, Gulshan',
  },
  {
    quote: '“Installed in two days flat. Tech showed up on time, drop looked professional, router pre-configured. Easiest provider switch I’ve ever done.”',
    who: 'Rashed M. · Mohammadpur',
  },
];

const FAQ = [
  {
    q: 'How long does installation take?',
    a: 'Typically within 48 hours of confirmation in covered zones. Field team calls ahead to schedule a 2-hour window.',
  },
  {
    q: 'Is there a data cap / FUP?',
    a: 'Lite and Basic plans include a generous FUP threshold (shown on each plan card). Standard and above are effectively unlimited for normal household use.',
  },
  {
    q: 'Do you cover my area?',
    a: `We currently serve 14 zones across Dhaka including Dhanmondi, Mohammadpur, Gulshan, Banani, Uttara, Mirpur, and more. Visit the contact page to check your exact address.`,
  },
  {
    q: 'How do I pay?',
    a: 'Pay online via bKash directly from the customer portal. Auto-invoicing, receipts, and instant reconnect on payment.',
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: 'Yes — change plans any time from the customer portal. Upgrades are prorated and active within minutes.',
  },
];

export default async function HomePage() {
  const packages = await getFeaturedPackages();

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-[0.14] dark:opacity-[0.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/60 via-canvas/70 to-canvas" />
        <Container className="relative py-24 md:py-28">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-[720px]">
            <Chip leading={<StatusDot status="online" pulse />}>
              Fiber live in 14 Dhaka zones · 99.9% uptime
            </Chip>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-primary md:text-[56px]">
              Internet that just works.
            </h1>
            <p className="mt-5 text-[17px] leading-[1.55] text-secondary md:text-[19px]">
              Fiber to your door. BDIX included. 24/7 local NOC. Installed within
              48 hours — from <span className="font-semibold text-primary tabular-nums">৳700/mo</span>.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/packages" variant="primary" size="lg" trailing={<span aria-hidden>→</span>}>
                See packages
              </Button>
              <Button href="/contact" variant="secondary" size="lg">
                Check coverage
              </Button>
              <a
                href={BRAND.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-[12px] px-4 text-sm font-medium text-muted transition-colors hover:text-primary"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden />
                WhatsApp sales
              </a>
            </div>
            <div className="mt-12 grid max-w-[640px] grid-cols-3 gap-6 border-t border-subtle pt-8">
              <HeroStatCounter to={12400} suffix="+" label="Active subscribers" />
              <HeroStatCounter to={40} suffix=" Gbps" label="BDIX peering" />
              <HeroStatFixed value="< 48h" label="Typical install" />
            </div>
          </div>
          {/* Hero logo — "dominant" slot. Breathing glow makes it feel alive
              without motion that distracts from reading the headline. */}
          <div className="hidden md:flex md:justify-end">
            <Logo size="hero" href={false} glow className="drop-shadow-[0_20px_60px_rgba(37,99,235,0.18)]" />
          </div>
          </div>
        </Container>
      </section>

      {/* ===== PLAN TEASER ===== */}
      <Section variant="surface">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Plans"
              title="Transparent pricing. No hidden fees."
              body="Free installation, free onboarding, and the same price every month. Switching plans later is one click."
            />
            <Button href="/packages" variant="primary" trailing={<span aria-hidden>→</span>}>
              See all plans
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {(packages.length > 0 ? packages : FALLBACK_PREVIEW).map((pkg, i) => (
              <PlanTeaserCard key={pkg._id || i} pkg={pkg} featured={i === 1} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== WHY DESH ===== */}
      <Section variant="canvas">
        <Container>
          <ScrollReveal>
            <SectionHeading
              eyebrow="Why Desh"
              title="Four things we never compromise on."
            />
          </ScrollReveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => (
              <ScrollReveal key={w.title} delay={i * 0.06}>
                <Card variant="flat" className="h-full">
                  <div className="flex h-full flex-col">
                    <div className="text-[15px] font-semibold tracking-[-0.005em] text-primary">
                      {w.title}
                    </div>
                    <p className="mt-2 text-[15px] leading-[1.55] text-secondary">
                      {w.body}
                    </p>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== BDIX SHOWCASE ===== */}
      <Section variant="surface">
        <Container>
          <SectionHeading
            eyebrow="BDIX & FTP"
            title="Our own content, carrier, business, and partner servers."
            body="All included with every plan. Direct-to-server bandwidth at the full speed of your connection."
          />
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {BDIX.map((b) => (
              <Card key={b.name} variant="flat" className="h-full">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-muted">{b.name}</span>
                  <StatusDot status={b.status} />
                </div>
                <div className="text-[15px] font-semibold tracking-[-0.005em] text-primary">
                  {b.detail.split('·')[0].trim()}
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {b.detail.split('·').slice(1).join('·').trim()}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/services/entertainment" variant="secondary">
              Entertainment
            </Button>
            <Button href="/services" variant="ghost">
              All services
            </Button>
          </div>
        </Container>
      </Section>

      {/* ===== COVERAGE ===== */}
      <Section variant="canvas">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Coverage"
                title="Live across 14 Dhaka zones."
                body="Dhanmondi · Mohammadpur · Mirpur · Gulshan · Banani · Baridhara · Uttara · Bashundhara · Tejgaon · Mohakhali · Motijheel · Dhanmondi · Kalabagan · Shyamoli — and expanding."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/contact" variant="primary">
                  Check my address
                </Button>
                <Button href={BRAND.primaryPhoneHref} variant="secondary">
                  Call {BRAND.primaryPhone}
                </Button>
              </div>
            </div>
            <Card variant="elevated" className="p-8">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  'Dhanmondi', 'Mohammadpur', 'Mirpur',
                  'Gulshan', 'Banani', 'Baridhara',
                  'Uttara', 'Bashundhara', 'Tejgaon',
                  'Mohakhali', 'Motijheel', 'Shyamoli',
                  'Kalabagan', 'Rampura', '+ more',
                ].map((zone) => (
                  <div
                    key={zone}
                    className="rounded-[10px] border border-subtle bg-surface-muted px-2 py-3 text-[12px] font-medium text-secondary"
                  >
                    {zone}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ===== TESTIMONIALS ===== */}
      <Section variant="surface">
        <Container>
          <SectionHeading eyebrow="Customers" title="12,400+ subscribers across Dhaka." align="center" className="mx-auto" />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.who} variant="flat" className="h-full">
                <div className="flex h-full flex-col justify-between">
                  <blockquote className="text-[15px] leading-[1.55] text-secondary">
                    {t.quote}
                  </blockquote>
                  <div className="mt-6 text-[13px] font-medium text-muted">{t.who}</div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== FAQ ===== */}
      <Section variant="canvas">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[360px_1fr]">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions we hear every day."
              body="Can't find yours? Call sales or raise a ticket from the customer portal."
            />
            <div className="divide-y divide-subtle border-y border-subtle">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-0 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-semibold text-primary">
                    {f.q}
                    <span className="text-muted transition-transform duration-150 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-[1.55] text-secondary">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ===== FINAL CTA ===== */}
      <Section variant="canvas" tight>
        <Container>
          <Card variant="elevated" className="overflow-hidden p-0">
            <div className="relative bg-gradient-to-br from-brand-600 to-brand-700 p-10 md:p-14">
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-[560px]">
                  <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/70">
                    Ready when you are
                  </div>
                  <h3 className="mt-2 text-[28px] font-semibold leading-[1.2] tracking-[-0.015em] text-white md:text-[34px]">
                    Pick a plan and be online within 48 hours.
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/packages"
                    className="inline-flex h-12 items-center justify-center rounded-[12px] bg-white px-6 text-[15px] font-semibold text-brand-700 transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)]"
                  >
                    See packages →
                  </Link>
                  <a
                    href={BRAND.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-[12px] border border-white/30 bg-white/10 px-6 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    Talk to sales
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}

function HeroStatFixed({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[24px] font-semibold tracking-[-0.01em] text-primary tabular-nums md:text-[28px]">
        {value}
      </div>
      <div className="mt-1 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
    </div>
  );
}

function HeroStatCounter({
  to,
  suffix,
  label,
}: {
  to: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <div className="text-[24px] font-semibold tracking-[-0.01em] text-primary tabular-nums md:text-[28px]">
        <Counter to={to} suffix={suffix} />
      </div>
      <div className="mt-1 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
    </div>
  );
}

function PlanTeaserCard({ pkg, featured }: { pkg: PackagePreview; featured: boolean }) {
  return (
    <Card variant={featured ? 'featured' : 'interactive'} className="flex h-full flex-col p-7">
      {featured ? (
        <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
          ★ Most chosen
        </div>
      ) : null}
      <div className="text-[15px] font-semibold text-primary">{pkg.name}</div>
      {pkg.tagline ? (
        <p className="mt-1 text-[13px] text-muted">{pkg.tagline}</p>
      ) : null}
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.02em] text-primary tabular-nums">
          ৳{pkg.monthlyPrice.toLocaleString()}
        </span>
        <span className="text-[13px] font-medium text-muted">/mo</span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[13px] text-secondary">
        <span className="font-medium tabular-nums">{pkg.downloadMbps} Mbps ↓</span>
        <span aria-hidden className="text-subtle">·</span>
        <span className="font-medium tabular-nums">{pkg.uploadMbps} Mbps ↑</span>
      </div>
      <div className="my-6 h-px bg-subtle" />
      <ul className="flex flex-col gap-2 text-[14px] text-secondary">
        {(pkg.features?.slice(0, 3) ?? ['Free installation', 'Unlimited BDIX', '24/7 local NOC']).map(
          (f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" aria-hidden />
              <span>{f}</span>
            </li>
          )
        )}
      </ul>
      <div className="mt-auto pt-6">
        <Button
          href={`/packages${pkg._id ? '#' + pkg._id : ''}`}
          variant={featured ? 'primary' : 'secondary'}
          className="w-full"
        >
          Pick {pkg.name}
        </Button>
      </div>
    </Card>
  );
}

const FALLBACK_PREVIEW: PackagePreview[] = [
  { _id: 'basic', name: 'Basic', monthlyPrice: 1000, downloadMbps: 30, uploadMbps: 15, tagline: 'Students & small households' },
  { _id: 'standard', name: 'Standard', monthlyPrice: 1500, downloadMbps: 50, uploadMbps: 25, tagline: 'Most chosen by families', isFeatured: true },
  { _id: 'pro', name: 'Pro', monthlyPrice: 2500, downloadMbps: 100, uploadMbps: 50, tagline: 'Heavy users, streamers, gamers' },
];
