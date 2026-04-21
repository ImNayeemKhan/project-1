import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-slate-900">ISP Platform</h1>
        <p className="mt-3 text-slate-600">
          Manage customers, plans, billing, MikroTik routers, and payments from one dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="btn-primary">Sign in</Link>
          <Link href="/customer" className="btn-secondary">Customer portal</Link>
        </div>
      </div>
    </main>
  );
}
