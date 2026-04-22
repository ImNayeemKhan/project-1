import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchFtpServers } from '@/lib/ftp';
import { FtpCard } from '@/components/FtpCard';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Business services — ${BRAND.name}`,
  description:
    'Symmetrical fiber, business-grade SLA, managed routers, file vault and automated backup for SMBs and enterprises.',
};

export default async function BusinessServicesPage() {
  const servers = await fetchFtpServers('business');
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <nav className="text-xs text-slate-500">
          <Link href="/services" className="hover:text-brand-600">Services</Link> / Business
        </nav>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Business services</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          We treat business connections as managed services — symmetrical fiber, a written SLA,
          priority ticket response, and our file vault / backup infrastructure. One monthly
          bill, one phone number for support.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            title: 'Symmetrical fiber',
            body: '50 Mbps to 1 Gbps symmetrical. Dedicated bandwidth, no contention, no throttling during peak.',
          },
          {
            title: '99.9% uptime SLA',
            body: 'Written SLA with service credits on downtime. 24/7 NOC, managed routers, and proactive monitoring.',
          },
          {
            title: 'Static IP + hosting-ready',
            body: 'Optional dedicated IPv4, reverse DNS, and port forwarding so you can host VPN, CCTV, or small servers.',
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <div className="text-lg font-semibold text-slate-900">{f.title}</div>
            <p className="mt-2 text-sm text-slate-700">{f.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Business file infrastructure</h2>
      {servers.length === 0 ? (
        <p className="text-center text-slate-500">Business file servers will appear here once provisioned.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => <FtpCard key={s._id} server={s} />)}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-brand-50 p-8 text-center">
        <h3 className="text-xl font-semibold text-slate-900">Talk to our business team</h3>
        <p className="mt-2 text-sm text-slate-700">
          Tell us about your site and we&apos;ll propose a tailored plan within 24 hours.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/contact" className="btn-primary">Request a quote</Link>
          <Link href="/packages" className="btn-secondary">See business packages</Link>
        </div>
      </div>
    </div>
  );
}
