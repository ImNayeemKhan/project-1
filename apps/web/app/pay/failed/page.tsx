import Link from 'next/link';

export default function PayFailed() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-2xl font-semibold text-red-700">Payment failed</h1>
        <p className="mt-2 text-slate-600">We couldn&apos;t process your payment. Please try again.</p>
        <Link href="/customer/invoices" className="btn-primary mt-4 inline-block">Back to invoices</Link>
      </div>
    </main>
  );
}
