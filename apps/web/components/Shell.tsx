'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, Role } from '@/lib/auth';
import { BRAND } from '@/lib/brand';

interface NavItem {
  href: string;
  label: string;
}

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/bi', label: 'Business intelligence' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/invoices', label: 'Invoices' },
  { href: '/admin/packages', label: 'Packages' },
  { href: '/admin/zones', label: 'Zones' },
  { href: '/admin/routers', label: 'Routers' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/leads', label: 'Leads (CRM)' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/wallet', label: 'Wallet' },
  { href: '/admin/ftp', label: 'FTP servers' },
  { href: '/admin/addons', label: 'Add-ons' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/webhooks', label: 'Webhooks' },
  { href: '/admin/feature-flags', label: 'Feature flags' },
  { href: '/admin/bulk-import', label: 'Bulk import' },
  { href: '/admin/audit-log', label: 'Audit log' },
  { href: '/admin/health', label: 'Health' },
  { href: '/admin/roles', label: 'Roles' },
];

const customerNav: NavItem[] = [
  { href: '/customer', label: 'Overview' },
  { href: '/customer/subscription', label: 'Manage plan' },
  { href: '/customer/invoices', label: 'Invoices' },
  { href: '/customer/usage', label: 'Usage' },
  { href: '/customer/referral', label: 'Refer a friend' },
  { href: '/customer/tickets', label: 'Support tickets' },
  { href: '/customer/announcements', label: 'Announcements' },
  { href: '/customer/ftp', label: 'FTP servers' },
  { href: '/customer/profile', label: 'Profile & wallet' },
];

export function Shell({
  role,
  children,
}: {
  role: Extract<Role, 'admin' | 'reseller' | 'customer'>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (role === 'admin' && user.role === 'customer') router.replace('/customer');
    if (role === 'customer' && user.role !== 'customer') router.replace('/admin');
  }, [user, loading, role, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  const nav = role === 'customer' ? customerNav : adminNav;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <Link
          href="/"
          className="flex items-center justify-center border-b border-slate-100 px-4 py-5 transition-opacity hover:opacity-90"
          aria-label={BRAND.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.logoUrl} alt={`${BRAND.name} logo`} className="h-16 w-auto" />
          <span className="sr-only">{BRAND.name}</span>
        </Link>
        <nav className="flex-1 space-y-1 px-2 py-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative block rounded-md px-3 py-2 text-sm transition-all duration-150 ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-600 transition-all duration-200 ${
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          <div className="font-medium text-slate-700">{user.name}</div>
          <div className="truncate">{user.email}</div>
          <button
            onClick={logout}
            className="mt-2 inline-flex items-center gap-1 rounded-md text-brand-600 transition-colors hover:text-brand-700"
          >
            <span className="underline-offset-2 hover:underline">Sign out</span>
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">↩</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
