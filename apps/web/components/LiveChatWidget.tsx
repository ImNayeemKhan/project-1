'use client';

import { useEffect, useRef, useState } from 'react';
import { api, extractError } from '@/lib/api';
import { BRAND } from '@/lib/brand';

/**
 * On-intent chat widget. Opens a small floating panel, collects
 * name/phone/message, and submits as a public contact lead so the sales
 * desk can triage it. Not a full chat system — a single message "send" that
 * creates a high-intent lead and hands the conversation off to WhatsApp.
 */
export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api.post('/api/public/contact', {
        name: form.name,
        phone: form.phone,
        message: `[Live chat] ${form.message}`,
      });
      setSent(true);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-2xl"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-semibold">Chat with sales</div>
              <div className="text-[11px] opacity-80">Typical reply: under 5 minutes</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
              ×
            </button>
          </div>

          {sent ? (
            <div className="p-5 text-sm">
              <div className="font-semibold text-slate-900">Got it — we&apos;ll ring you shortly.</div>
              <p className="mt-2 text-slate-600">
                Want an instant reply? Message us on WhatsApp at {BRAND.primaryPhone}.
              </p>
              <a
                href={BRAND.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Open WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 p-4">
              <input
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Mobile number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <textarea
                className="input h-24"
                placeholder="What do you need help with?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              {err && <div className="text-xs text-red-600">{err}</div>}
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
                {busy ? 'Sending…' : 'Send message'}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Prefer voice? Call {BRAND.primaryPhone}
              </p>
            </form>
          )}
        </div>
      )}
    </>
  );
}
