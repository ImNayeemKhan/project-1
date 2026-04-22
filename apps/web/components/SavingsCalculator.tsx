'use client';

import { useMemo, useState } from 'react';

/**
 * "How much will you save vs your current ISP" calculator. Pure client-side
 * math — monthly cost difference × 12 months, with a secondary FUP warning
 * if the target plan has a data cap.
 */
export function SavingsCalculator({
  defaultCurrent = 1500,
  defaultTarget = 1200,
  targetFupGB,
  targetName = 'your chosen plan',
}: {
  defaultCurrent?: number;
  defaultTarget?: number;
  targetFupGB?: number;
  targetName?: string;
}) {
  const [currentBill, setCurrentBill] = useState(defaultCurrent);
  const [targetBill, setTargetBill] = useState(defaultTarget);
  const [dailyGB, setDailyGB] = useState(3);

  const { monthly, yearly } = useMemo(() => {
    const m = Math.max(0, currentBill - targetBill);
    return { monthly: m, yearly: m * 12 };
  }, [currentBill, targetBill]);

  const monthlyUsage = dailyGB * 30;
  const overFup = targetFupGB != null && monthlyUsage > targetFupGB;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Savings calculator</h3>
      <p className="text-sm text-slate-500">
        See how much you save vs your current provider — and whether your monthly data fits.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Your current monthly bill (৳)"
          value={currentBill}
          onChange={setCurrentBill}
          min={0}
          step={50}
        />
        <Field
          label={`${targetName} monthly (৳)`}
          value={targetBill}
          onChange={setTargetBill}
          min={0}
          step={50}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Your daily data usage (GB)
        </label>
        <input
          type="range"
          min={0.5}
          max={30}
          step={0.5}
          value={dailyGB}
          onChange={(e) => setDailyGB(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{dailyGB} GB / day</span>
          <span>{monthlyUsage.toFixed(0)} GB / month</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Monthly savings
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">৳{monthly.toFixed(0)}</div>
        </div>
        <div className="rounded-xl bg-brand-50 p-4 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            Yearly savings
          </div>
          <div className="mt-1 text-2xl font-bold text-brand-700">৳{yearly.toFixed(0)}</div>
        </div>
      </div>

      {overFup && targetFupGB && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Heads up — your estimated usage ({monthlyUsage.toFixed(0)} GB/mo) exceeds the{' '}
          <strong>{targetFupGB} GB</strong> data cap. Consider the next tier up.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input"
      />
    </label>
  );
}
