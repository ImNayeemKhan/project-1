import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.logoUrl} alt={`${BRAND.name} logo`} className="h-9 w-auto" />
            <span className="sr-only">{BRAND.name}</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link href="/" className="text-slate-700 hover:text-brand-600">Home</Link>
            <Link href="/packages" className="text-slate-700 hover:text-brand-600">Packages</Link>
            <Link href="/services" className="text-slate-700 hover:text-brand-600">Services</Link>
            <Link href="/services/entertainment" className="text-slate-700 hover:text-brand-600">Entertainment</Link>
            <Link href="/about" className="text-slate-700 hover:text-brand-600">About</Link>
            <Link href="/contact" className="text-slate-700 hover:text-brand-600">Contact</Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a
              href={BRAND.primaryPhoneHref}
              className="hidden text-sm font-semibold text-brand-700 hover:underline lg:inline"
            >
              Call {BRAND.primaryPhone}
            </a>
            <Link href="/login" className="btn-secondary">Sign in</Link>
            <Link href="/contact" className="btn-primary">Get connected</Link>
          </div>
          <Link href="/login" className="btn-secondary md:hidden">Sign in</Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.logoUrl} alt={`${BRAND.name} logo`} className="h-10 w-auto" />
            <p className="mt-3 text-sm text-slate-600">{BRAND.mission}</p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Explore</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><Link href="/packages">Packages</Link></li>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/services/entertainment">Entertainment FTP</Link></li>
              <li><Link href="/services/business">Business</Link></li>
              <li><Link href="/services/carrier">Carrier</Link></li>
              <li><Link href="/services/partnership">Partnership</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Get in touch</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {BRAND.phones.map((p) => (
                <li key={p.value}>
                  <a href={p.href}>{p.value}</a>
                </li>
              ))}
              <li><a href={BRAND.emailHref}>{BRAND.email}</a></li>
              <li><Link href="/login">Customer self-care</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Head office</div>
            <p className="mt-2 text-sm text-slate-600">
              {BRAND.address.line1}
              <br />
              {BRAND.address.line2}
              <br />
              {BRAND.address.line3}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
