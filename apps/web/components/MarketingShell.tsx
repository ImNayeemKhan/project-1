import Link from 'next/link';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-brand-600">
            ISP Platform
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <Link href="/" className="text-slate-700 hover:text-brand-600">Home</Link>
            <Link href="/packages" className="text-slate-700 hover:text-brand-600">Packages</Link>
            <Link href="/about" className="text-slate-700 hover:text-brand-600">About</Link>
            <Link href="/contact" className="text-slate-700 hover:text-brand-600">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">Sign in</Link>
            <Link href="/contact" className="btn-primary hidden md:inline-flex">Get connected</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-4">
          <div>
            <div className="text-lg font-semibold text-brand-600">ISP Platform</div>
            <p className="mt-2 text-sm text-slate-600">
              Fiber-grade internet for homes and businesses. Fast, reliable, and locally supported.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Explore</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><Link href="/packages">Packages</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Support</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><Link href="/login">Customer portal</Link></li>
              <li><a href="tel:+8809000000000">+880 9000 000 000</a></li>
              <li><a href="mailto:hello@ispplatform.example">hello@ispplatform.example</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Address</div>
            <p className="mt-2 text-sm text-slate-600">
              House 12, Road 5<br />
              Dhanmondi, Dhaka
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ISP Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
