'use client';

import { useState } from 'react';
import { BRAND } from '@/lib/brand';
import { CoverageChecker } from '@/components/CoverageChecker';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, address, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Request failed');
      }
      setOk(true);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setMessage('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Get connected with {BRAND.shortName}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Drop your details and our sales team will reach out within one business day to confirm
        coverage, recommend a plan, and schedule installation.
      </p>

      <div className="mt-8">
        <CoverageChecker />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[2fr_1fr]">
        <form onSubmit={onSubmit} className="card space-y-4">
          {ok && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Thanks! We&apos;ve received your request and will call you shortly.
            </div>
          )}
          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {err}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input
                className="input"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801xxxxxxxxx"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email (optional)</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Installation address</label>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, road, area"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
            <textarea
              className="input min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your needs — number of devices, business use, etc."
            />
          </div>
          <button className="btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Request a connection'}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Talk to us</h3>
            <dl className="mt-3 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="space-y-0.5">
                  {BRAND.phones.map((p) => (
                    <div key={p.value}>
                      <a href={p.href} className="hover:text-brand-600">
                        {p.value}
                      </a>
                    </div>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd>
                  <a href={BRAND.emailHref} className="hover:text-brand-600">
                    {BRAND.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Head office</dt>
                <dd>
                  {BRAND.address.line1}
                  <br />
                  {BRAND.address.line2}
                  <br />
                  {BRAND.address.line3}
                </dd>
              </div>
            </dl>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Service hours</h3>
            <p className="mt-2 text-sm text-slate-600">
              Sales: Sat–Thu, 9:00–21:00
              <br />
              NOC &amp; technical support: 24/7
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
