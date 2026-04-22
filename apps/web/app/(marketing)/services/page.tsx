import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchAddons } from '@/lib/ftp';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Services — ${BRAND.name}`,
  description:
    'FTP / BDIX mirror servers, carrier peering, business file vault, and partner CDN ingest — plus service add-ons like static IP, IPTV, and cloud backup.',
};

const services = [
  {
    title: 'Entertainment',
    href: '/services/entertainment',
    tagline: 'Movies, series, games, software — at local speeds',
    body: 'Our local mirrors carry movies, TV series, anime, games, and software. Downloads from these servers run at your full line speed and do not count against your FUP.',
    image:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    tone: 'ring-brand-500',
  },
  {
    title: 'Carrier',
    href: '/services/carrier',
    tagline: 'Peering, transit and carrier exchange',
    body: 'If you run a downstream ISP, ISP reseller, or data-centre, our Carrier Exchange hands off route objects, CDR samples, and config templates over mTLS and BGP-validated peering.',
    image:
      'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=1200&q=80',
    tone: 'ring-slate-300',
  },
  {
    title: 'Business',
    href: '/services/business',
    tagline: 'File vault, backup and symmetrical fiber',
    body: 'Business customers get access to our encrypted SFTP/HTTPS vault for large-file transfers, automated backups, and cross-office file sharing — on top of the managed fiber link.',
    image:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    tone: 'ring-amber-300',
  },
  {
    title: 'Partnership',
    href: '/services/partnership',
    tagline: 'CDN origin drop and content distribution',
    body: 'OTT platforms, publishers, and universities push content to our partner ingest once and we replicate it to every POP, so your users on our network get it at local speeds.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    tone: 'ring-green-300',
  },
];

export default async function ServicesHubPage() {
  const addons = await fetchAddons();
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Services</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Beyond the fiber link, we run our own content and interconnect infrastructure so every byte
          we can serve locally, we do. Pick a category to see what&apos;s on the menu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {services.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className={`card group flex flex-col overflow-hidden p-0 transition hover:ring-2 ${s.tone}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt={s.title} className="h-48 w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-brand-600">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.tagline}</p>
              <p className="mt-3 text-sm text-slate-700">{s.body}</p>
              <span className="mt-4 text-sm font-medium text-brand-600">Learn more →</span>
            </div>
          </Link>
        ))}
      </div>

      {addons.length > 0 && (
        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Service add-ons</h2>
            <p className="mt-2 text-sm text-slate-600">
              Attach any of these to your base plan from <Link href="/contact" className="text-brand-600 hover:underline">Contact</Link>.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {addons.map((a) => (
              <article key={a._id} className="card flex flex-col overflow-hidden p-0">
                {a.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.imageUrl} alt={a.name} className="h-36 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{a.name}</h3>
                  {a.tagline && <p className="mt-1 text-sm text-slate-600">{a.tagline}</p>}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">৳{a.monthlyPrice}</span>
                    <span className="text-sm text-slate-500">/ month</span>
                  </div>
                  {a.setupFee > 0 && (
                    <div className="text-xs text-slate-500">+ ৳{a.setupFee} one-time setup</div>
                  )}
                  {a.features.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-slate-700">
                      {a.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5 text-brand-600">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/contact?addon=${a.code}`}
                    className="btn-primary mt-4 w-full justify-center"
                  >
                    Add to my plan
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
