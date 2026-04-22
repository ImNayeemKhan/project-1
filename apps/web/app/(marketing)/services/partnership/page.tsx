import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchFtpServers } from '@/lib/ftp';
import { FtpCard } from '@/components/FtpCard';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Partnership — ${BRAND.name}`,
  description:
    'Content distribution, CDN ingest, and co-marketing partnerships with OTT platforms, publishers, and educational institutions.',
};

export default async function PartnershipServicesPage() {
  const servers = await fetchFtpServers('partnership');
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <nav className="text-xs text-slate-500">
          <Link href="/services" className="hover:text-brand-600">Services</Link> / Partnership
        </nav>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Partnership programmes</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          We work with OTT platforms, publishers, game distributors, and universities to bring
          their content closer to our subscribers. You push content to our origin once and we
          mirror it to every POP across our network — your users inside our footprint get it at
          full local-ring speeds.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            title: 'Content partners',
            body: 'OTT / streaming, publishers, software vendors: reach every household on our network without paying a third-party CDN.',
          },
          {
            title: 'Academic partners',
            body: 'Universities and research institutions: host open courseware and datasets on our public mirror at no cost.',
          },
          {
            title: 'Reseller programme',
            body: 'Existing ISP or cable operator? Resell our fiber and RADIUS under your brand with a shared billing portal.',
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <div className="text-lg font-semibold text-slate-900">{f.title}</div>
            <p className="mt-2 text-sm text-slate-700">{f.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Partner ingest servers</h2>
      {servers.length === 0 ? (
        <p className="text-center text-slate-500">Partner servers will appear here once provisioned.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => <FtpCard key={s._id} server={s} />)}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-slate-900 p-8 text-center text-white">
        <h3 className="text-xl font-semibold">Let&apos;s build something together</h3>
        <p className="mt-2 text-sm text-slate-300">
          Email <a className="underline" href={BRAND.emailHref}>{BRAND.email}</a>
          {' '}with a short description of what you&apos;d like to distribute — we&apos;ll route you to the right team.
        </p>
      </div>
    </div>
  );
}
