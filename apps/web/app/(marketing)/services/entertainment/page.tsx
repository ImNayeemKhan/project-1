import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchFtpServers } from '@/lib/ftp';
import { FtpCard } from '@/components/FtpCard';

export const metadata: Metadata = {
  title: 'Entertainment FTP — ISP Platform',
  description: 'Local BDIX mirrors for movies, TV series, anime, games, and software.',
};

export default async function EntertainmentFtpPage() {
  const servers = await fetchFtpServers('entertainment');
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <nav className="text-xs text-slate-500">
          <Link href="/services" className="hover:text-brand-600">Services</Link> / Entertainment
        </nav>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Entertainment FTP mirrors</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Every active customer gets free access to our local mirror servers. Downloads run at your
          full line speed, don&apos;t count against your FUP, and include movies, TV series, anime,
          music, games, and software you&apos;d otherwise pull internationally.
        </p>
      </div>

      {servers.length === 0 ? (
        <p className="text-center text-slate-500">Our mirrors are being provisioned — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => <FtpCard key={s._id} server={s} />)}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-brand-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Not a customer yet?</h2>
        <p className="mt-2 text-sm text-slate-700">
          Pick a plan from our packages page and get free mirror access from day one.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/packages" className="btn-primary">See packages</Link>
          <Link href="/contact" className="btn-secondary">Get connected</Link>
        </div>
      </div>
    </div>
  );
}
