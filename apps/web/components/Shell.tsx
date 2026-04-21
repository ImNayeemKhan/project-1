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
];

const customerNav: NavItem[] = [
  { href: '/customer', label: 'Overview' },
  { href: '/customer/invoices', label: 'Invoices' },
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
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <Link href="/" className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.logoUrl} alt={`${BRAND.name} logo`} className="h-8 w-auto" />
          <span className="sr-only">{BRAND.name}</span>
        </Link>
        <nav className="flex-1 space-y-1 px-2 py-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          <div className="font-medium text-slate-700">{user.name}</div>
          <div className="truncate">{user.email}</div>
          <button onClick={logout} className="mt-2 text-brand-600 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
