'use client';

/**
 * Toast system — lightweight, zero-dep (uses the existing framer-motion
 * in the web app for enter/exit). Consumed via the `useToast()` hook
 * which is pushed through context so any component in the tree can emit
 * a toast without prop-drilling.
 *
 *   useToast().success('Saved');          // green checkmark
 *   useToast().error('Could not save');   // red X, slightly longer TTL
 *   useToast().info('Copied to clipboard');
 *
 * Stacks bottom-right, auto-dismisses after 3.5s (5s for errors), and
 * hovering a toast pauses its timer.
 */

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from './_clsx';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  description?: string;
}

interface ToastContextValue {
  push: (t: Omit<ToastItem, 'id'>) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Fallback no-op so components that accidentally render outside the
    // provider don't crash — they just silently skip toasts.
    return {
      push: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { ...t, id }]);
      const ttl = t.kind === 'error' ? 5000 : 3500;
      window.setTimeout(() => remove(id), ttl);
    },
    [remove],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, description) => push({ kind: 'success', message, description }),
      error: (message, description) => push({ kind: 'error', message, description }),
      info: (message, description) => push({ kind: 'info', message, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-end gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:px-0">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-auto w-full sm:w-[360px]"
            >
              <div
                className={clsx(
                  'flex items-start gap-3 rounded-[12px] border bg-surface p-3.5 shadow-pop',
                  t.kind === 'success' && 'border-emerald-200',
                  t.kind === 'error' && 'border-red-200',
                  t.kind === 'info' && 'border-subtle',
                )}
                role={t.kind === 'error' ? 'alert' : 'status'}
              >
                <ToastIcon kind={t.kind} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-5 text-primary">{t.message}</div>
                  {t.description && (
                    <div className="mt-0.5 text-[13px] leading-[1.4] text-secondary">
                      {t.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="ml-1 -mt-1 rounded-[6px] p-1 text-muted transition hover:bg-surface-muted hover:text-primary"
                  aria-label="Dismiss"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === 'success') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.05 }}
        className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500 text-white"
        aria-hidden
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.span>
    );
  }
  if (kind === 'error') {
    return (
      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-red-500 text-white" aria-hidden>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500 text-white" aria-hidden>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
  );
}
