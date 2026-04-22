'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BRAND } from '@/lib/brand';
import { Logo } from './ui/Logo';
import { FloatingCta } from './FloatingCta';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/packages', label: 'Packages' },
  { href: '/services', label: 'Services' },
  { href: '/services/entertainment', label: 'Entertainment' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur transition-all duration-200 ${
          scrolled
            ? 'border-slate-200 bg-white/95 shadow-sm'
            : 'border-transparent bg-white/80'
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-200 ${
            scrolled ? 'py-2' : 'py-4'
          }`}
        >
          <Link href="/" className="flex items-center gap-3" aria-label={BRAND.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND.logoUrl}
              alt={`${BRAND.name} logo`}
              className={`w-auto transition-all duration-300 ease-out ${
                scrolled ? 'h-16' : 'h-24 md:h-28'
              }`}
            />
            <span className="sr-only">{BRAND.name}</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            {nav.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative transition-colors duration-150 hover:text-brand-600 ${
                    active ? 'text-brand-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-brand-600 transition-all duration-300 ease-out ${
                      active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-70'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href={BRAND.primaryPhoneHref}
              className="hidden text-sm font-semibold text-brand-700 hover:underline lg:inline"
            >
              Call {BRAND.primaryPhone}
            </a>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
            <Link href="/contact" className="btn-primary">
              Get connected
            </Link>
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">Toggle menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 px-3 pt-2">
                <Link href="/login" className="btn-secondary flex-1 justify-center">
                  Sign in
                </Link>
                <Link href="/contact" className="btn-primary flex-1 justify-center">
                  Get connected
                </Link>
              </div>
              <a
                href={BRAND.primaryPhoneHref}
                className="mt-2 rounded-md bg-brand-50 px-3 py-2 text-center text-sm font-semibold text-brand-700"
              >
                Call {BRAND.primaryPhone}
              </a>
            </nav>
          </motion.div>
        )}
        </AnimatePresence>
      </header>

      <main>{children}</main>

      <footer className="mt-24 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <Logo size="2xl" href={false} className="-ml-1" />
            <p className="mt-4 text-sm text-slate-600">{BRAND.mission}</p>
            <div className="mt-4 flex gap-2">
              <a
                href={BRAND.social.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M13.5 22v-9h3l.5-3.5h-3.5V7.2c0-1 .3-1.7 1.8-1.7H17V2.3C16.7 2.3 15.4 2 14 2c-3 0-5 1.8-5 5.2V9.5H6V13h3v9h4.5z" />
                </svg>
              </a>
              <a
                href={BRAND.social.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M22 12s0-3.3-.4-4.9a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.3a2.5 2.5 0 0 0-1.8 1.8C2 8.7 2 12 2 12s0 3.3.4 4.9a2.5 2.5 0 0 0 1.8 1.8c1.6.3 7.8.3 7.8.3s6.2 0 7.8-.3a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.9.4-4.9zM10 15.5v-7l6 3.5-6 3.5z" />
                </svg>
              </a>
              <a
                href={BRAND.whatsappHref}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-green-500 hover:text-green-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20 4A10 10 0 0 0 4.1 16.3L3 21l4.8-1.1A10 10 0 1 0 20 4zm-8 18a8 8 0 0 1-4-1.1l-.3-.2-2.8.7.7-2.7-.2-.3a8 8 0 1 1 6.6 3.6zm4.5-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1-.1.2-.6.8-.7.9-.1.1-.3.1-.5 0s-1-.4-2-1.2c-.7-.6-1.2-1.4-1.4-1.6-.1-.2 0-.4.1-.5l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.3-.5-.3h-.4c-.2 0-.4 0-.6.3s-.8.8-.8 2 .8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.5 2.3 1 2.3.6 2.7.6.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Explore</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><Link href="/packages" className="hover:text-brand-600">Packages</Link></li>
              <li><Link href="/services" className="hover:text-brand-600">Services</Link></li>
              <li><Link href="/services/entertainment" className="hover:text-brand-600">Entertainment FTP</Link></li>
              <li><Link href="/services/business" className="hover:text-brand-600">Business</Link></li>
              <li><Link href="/services/carrier" className="hover:text-brand-600">Carrier</Link></li>
              <li><Link href="/services/partnership" className="hover:text-brand-600">Partnership</Link></li>
              <li><Link href="/about" className="hover:text-brand-600">About us</Link></li>
              <li><Link href="/contact" className="hover:text-brand-600">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Get in touch</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {BRAND.phones.map((p) => (
                <li key={p.value}>
                  <a href={p.href} className="hover:text-brand-600">{p.value}</a>
                </li>
              ))}
              <li><a href={BRAND.emailHref} className="hover:text-brand-600">{BRAND.email}</a></li>
              <li>
                <a href={BRAND.selfcareUrl} target="_blank" rel="noreferrer" className="hover:text-brand-600">
                  Customer self-care
                </a>
              </li>
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
            <p className="mt-3 text-xs text-slate-500">{BRAND.supportHours}</p>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </footer>

      <FloatingCta />
    </div>
  );
}
