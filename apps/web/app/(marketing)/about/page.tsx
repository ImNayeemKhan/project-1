import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — ISP Platform',
  description: 'Who we are, what we run, and how we look after our customers.',
};

const TEAM_IMG =
  'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80';

const NOC_IMG =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold text-slate-900">About us</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        We&apos;re a Dhaka-based fiber ISP, built by network engineers who were tired of dropped
        calls, throttled streams, and support teams that never follow through. We run a modern
        MikroTik + RADIUS core, a 24/7 NOC, and a customer portal our team actually uses.
      </p>

      <div className="mt-10 overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={TEAM_IMG} alt="Team collaborating on a network diagram" className="h-80 w-full object-cover" />
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Our mission</h2>
          <p className="mt-3 text-slate-600">
            To deliver honest, business-grade connectivity to every neighbourhood — with
            transparent billing, predictable speeds, and support that treats every customer as a
            long-term partner.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">What we run</h2>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li>• Carrier-grade fiber core with redundant upstream</li>
            <li>• MikroTik RouterOS PPPoE with RADIUS AAA</li>
            <li>• 24/7 NOC monitoring, PagerDuty-style escalations</li>
            <li>• Automated billing, bKash online payments, and self-service portal</li>
          </ul>
        </div>
      </div>

      <div className="mt-14 overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={NOC_IMG} alt="Operations centre monitors" className="h-72 w-full object-cover" />
      </div>

      <div className="mt-14">
        <h2 className="text-2xl font-semibold text-slate-900">Coverage</h2>
        <p className="mt-3 text-slate-600">
          We currently operate in Dhanmondi, Uttara, Gulshan, and Mirpur. Expanding neighbourhood
          by neighbourhood — drop us your address on the contact page and we&apos;ll confirm if we
          can light up your block.
        </p>
      </div>
    </div>
  );
}
