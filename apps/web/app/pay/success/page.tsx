import Link from 'next/link';

export default function PaySuccess({ searchParams }: { searchParams: { tx?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-2xl font-semibold text-green-700">Payment successful</h1>
        <p className="mt-2 text-slate-600">
          {searchParams.tx ? <>Transaction ID: <span className="font-mono">{searchParams.tx}</span></> : 'Your payment has been recorded.'}
        </p>
        <Link href="/customer/invoices" className="btn-primary mt-4 inline-block">Back to invoices</Link>
      </div>
    </main>
  );
}
