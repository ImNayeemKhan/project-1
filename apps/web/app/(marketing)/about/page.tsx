import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `About — ${BRAND.name}`,
  description: `About ${BRAND.name} — our mission, vision, network, and coverage.`,
};

const TEAM_IMG =
  'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80';

const NOC_IMG =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold text-slate-900">
        {BRAND.name} — The Ultimate Solutions of Network Services
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">{BRAND.about}</p>

      <div className="mt-10 overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={TEAM_IMG} alt="Team collaborating on a network diagram" className="h-80 w-full object-cover" />
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Our mission</h2>
          <p className="mt-3 text-slate-600">
            To deliver reliable, high-speed internet connectivity to individuals, businesses, and
            communities — empowering them to connect, communicate, and thrive in the digital age.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Our vision</h2>
          <p className="mt-3 text-slate-600">
            To revolutionize connectivity in Bangladesh by making high-speed internet accessible to
            every corner of the country — reliable, affordable, and universal.
          </p>
        </div>
      </div>

      <div className="mt-14 overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={NOC_IMG} alt="Operations centre monitors" className="h-72 w-full object-cover" />
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">What we run</h2>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li>• Carrier-grade fiber core with redundant upstream providers</li>
            <li>• BDIX peering with local entertainment and cache mirrors</li>
            <li>• MikroTik RouterOS PPPoE with RADIUS AAA</li>
            <li>• 24/7 NOC monitoring with tiered escalations</li>
            <li>• Automated billing, bKash online payments, and self-service portal</li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Coverage</h2>
          <p className="mt-3 text-slate-600">
            Head-end at {BRAND.address.line1}, {BRAND.address.line2}, {BRAND.address.line3}.
            We operate across Mohammadpur, Dhanmondi, Mirpur, Adabor, and Lalmatia — expanding
            neighbourhood by neighbourhood. Drop us your address on the contact page and
            we&apos;ll confirm if we can light up your block.
          </p>
        </div>
      </div>

      <div className="mt-14 rounded-xl bg-slate-50 p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Talk to us</h2>
        <p className="mt-3 text-slate-600">
          Call {BRAND.primaryPhone} or email{' '}
          <a className="text-brand-600 hover:underline" href={BRAND.emailHref}>
            {BRAND.email}
          </a>
          . {BRAND.supportHours}.
        </p>
      </div>
    </div>
  );
}
