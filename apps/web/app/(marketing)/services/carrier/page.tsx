import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchFtpServers } from '@/lib/ftp';
import { FtpCard } from '@/components/FtpCard';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Carrier services — ${BRAND.name}`,
  description: 'Peering, IP transit, carrier exchange, and NTTN interconnect services.',
};

export default async function CarrierServicesPage() {
  const servers = await fetchFtpServers('carrier');
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <nav className="text-xs text-slate-500">
          <Link href="/services" className="hover:text-brand-600">Services</Link> / Carrier
        </nav>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Carrier &amp; peering</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          We interconnect with downstream ISPs, NTTN carriers, and data-centre operators on public
          IX fabrics as well as private peering. Our Carrier Exchange is where we hand off
          signed route objects, CDR samples, and configuration templates between peers.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            title: 'IP transit',
            body: 'Dual-stack IPv4/IPv6 transit with RPKI-validated prefixes. 10/40/100G handoffs available.',
          },
          {
            title: 'Private peering',
            body: 'Direct L2 interconnect at our core POPs. Zero-settlement for symmetrical traffic above 1 Gbps.',
          },
          {
            title: 'NTTN last-mile',
            body: 'Light up new buildings on our fiber footprint under a revenue-share model — we handle trenching and splicing.',
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <div className="text-lg font-semibold text-slate-900">{f.title}</div>
            <p className="mt-2 text-sm text-slate-700">{f.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Carrier exchange servers</h2>
      {servers.length === 0 ? (
        <p className="text-center text-slate-500">Carrier exchange servers will appear here once provisioned.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => <FtpCard key={s._id} server={s} />)}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-slate-900 p-8 text-center text-white">
        <h3 className="text-xl font-semibold">Interested in peering?</h3>
        <p className="mt-2 text-sm text-slate-300">
          Mail <a className="underline" href={BRAND.emailHref}>{BRAND.email}</a> with your AS number,
          preferred handoff location and expected capacity — we&apos;ll reply within one business day.
        </p>
      </div>
    </div>
  );
}
