import { startOfDay, startOfMonth, subDays, subMonths, addMonths, format } from 'date-fns';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { Package } from '../models/Package';
import { Ticket } from '../models/Ticket';

// ---------- Revenue & growth -------------------------------------------------

/**
 * Monthly Recurring Revenue = sum of monthlyPrice across all non-cancelled subscriptions.
 * Suspended subs are excluded because they do not generate revenue.
 */
export async function getMrr(): Promise<number> {
  const rows = await Subscription.aggregate<{ total: number }>([
    { $match: { status: 'active' } },
    {
      $lookup: {
        from: 'packages',
        localField: 'package',
        foreignField: '_id',
        as: 'pkg',
      },
    },
    { $unwind: '$pkg' },
    { $group: { _id: null, total: { $sum: '$pkg.monthlyPrice' } } },
  ]);
  return rows[0]?.total ?? 0;
}

export async function getArpu(): Promise<number> {
  const [mrr, activeCount] = await Promise.all([
    getMrr(),
    Subscription.countDocuments({ status: 'active' }),
  ]);
  return activeCount > 0 ? mrr / activeCount : 0;
}

/**
 * Revenue trend — daily successful payment totals for the last N days.
 */
export async function getRevenueTrend(days = 30) {
  const from = subDays(startOfDay(new Date()), days);
  const items = await Payment.aggregate<{ _id: string; total: number; count: number }>([
    { $match: { status: 'success', processedAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$processedAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  // Fill missing days with zeros so the chart has no gaps.
  const filled: { date: string; total: number; count: number }[] = [];
  for (let i = 0; i <= days; i++) {
    const d = format(subDays(startOfDay(new Date()), days - i), 'yyyy-MM-dd');
    const row = items.find((x) => x._id === d);
    filled.push({ date: d, total: row?.total ?? 0, count: row?.count ?? 0 });
  }
  return filled;
}

/** Monthly revenue series for the last N months — useful for MoM growth. */
export async function getMonthlyRevenueSeries(months = 12) {
  const from = startOfMonth(subMonths(new Date(), months - 1));
  const items = await Payment.aggregate<{ _id: string; total: number }>([
    { $match: { status: 'success', processedAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$processedAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const filled: { month: string; total: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = format(subMonths(startOfMonth(new Date()), months - 1 - i), 'yyyy-MM');
    const row = items.find((x) => x._id === d);
    filled.push({ month: d, total: row?.total ?? 0 });
  }
  return filled;
}

// ---------- Churn & cohort retention -----------------------------------------

/**
 * Churn rate = cancelled subs this month / active at start of month.
 * Returned as a percentage (e.g. 2.3 means 2.3%).
 */
export async function getChurnRate(): Promise<number> {
  const monthStart = startOfMonth(new Date());
  const [cancelled, activeAtStart] = await Promise.all([
    Subscription.countDocuments({
      status: 'cancelled',
      cancelledAt: { $gte: monthStart },
    }),
    Subscription.countDocuments({
      status: { $in: ['active', 'suspended', 'cancelled'] },
      createdAt: { $lt: monthStart },
    }),
  ]);
  if (activeAtStart === 0) return 0;
  return +((cancelled / activeAtStart) * 100).toFixed(2);
}

/**
 * Cohort retention grid. For each cohort month (subscriber sign-up month)
 * show the fraction still active N months later. Returned as a matrix
 * rows[i].retained[j] where j is months since cohort start.
 */
export async function getCohortRetention(months = 6) {
  const cohortStart = startOfMonth(subMonths(new Date(), months - 1));
  const cohorts = await Subscription.aggregate<{
    _id: string;
    size: number;
    ids: string[];
  }>([
    { $match: { createdAt: { $gte: cohortStart } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        size: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const grid: { cohort: string; size: number; retained: (number | null)[] }[] = [];
  for (const c of cohorts) {
    const [year, month] = c._id.split('-').map(Number);
    const cohortStartDate = new Date(Date.UTC(year, month - 1, 1));
    const retained: (number | null)[] = [];
    for (let m = 0; m < months; m++) {
      const windowEnd = addMonths(cohortStartDate, m + 1);
      if (windowEnd > new Date()) {
        retained.push(null);
        continue;
      }
      // Count subs from this cohort still non-cancelled at windowEnd.
      const stillActive = await Subscription.countDocuments({
        _id: { $in: c.ids },
        $or: [
          { status: { $in: ['active', 'suspended'] } },
          { cancelledAt: { $gte: windowEnd } },
        ],
      });
      retained.push(c.size > 0 ? +((stillActive / c.size) * 100).toFixed(1) : 0);
    }
    grid.push({ cohort: c._id, size: c.size, retained });
  }
  return grid;
}

// ---------- AR / collections -------------------------------------------------

export async function getArAging() {
  const now = new Date();
  const buckets = [
    { label: '0-30', from: 0, to: 30 },
    { label: '31-60', from: 31, to: 60 },
    { label: '61-90', from: 61, to: 90 },
    { label: '90+', from: 91, to: 3650 },
  ];
  return Promise.all(
    buckets.map(async (b) => {
      const toDate = subDays(now, b.from);
      const fromDate = subDays(now, b.to);
      const agg = await Invoice.aggregate<{ count: number; total: number }>([
        {
          $match: {
            status: { $in: ['unpaid', 'overdue'] },
            dueDate: { $gte: fromDate, $lte: toDate },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]);
      return { bucket: b.label, count: agg[0]?.count ?? 0, total: agg[0]?.total ?? 0 };
    })
  );
}

/**
 * Collection efficiency = paid / (paid + still-outstanding) for invoices issued this month.
 * Returned as percentage.
 */
export async function getCollectionEfficiency(): Promise<number> {
  const monthStart = startOfMonth(new Date());
  const [paid, outstanding] = await Promise.all([
    Invoice.aggregate<{ total: number }>([
      { $match: { status: 'paid', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.aggregate<{ total: number }>([
      { $match: { status: { $in: ['unpaid', 'overdue'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  const paidTotal = paid[0]?.total ?? 0;
  const outstandingTotal = outstanding[0]?.total ?? 0;
  const denom = paidTotal + outstandingTotal;
  return denom === 0 ? 100 : +((paidTotal / denom) * 100).toFixed(1);
}

/** Failed payment reasons / counts over last 30 days. */
export async function getFailedPaymentBreakdown() {
  const from = subDays(new Date(), 30);
  return Payment.aggregate<{ _id: string; count: number; total: number }>([
    { $match: { status: { $in: ['failed', 'cancelled'] }, createdAt: { $gte: from } } },
    {
      $group: {
        _id: '$gateway',
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { count: -1 } },
  ]);
}

// ---------- Mix & segmentation ----------------------------------------------

export async function getPackageMix() {
  const rows = await Subscription.aggregate<{
    _id: string;
    subs: number;
    revenue: number;
    category: string;
    packageName: string;
  }>([
    { $match: { status: { $in: ['active', 'suspended'] } } },
    {
      $lookup: {
        from: 'packages',
        localField: 'package',
        foreignField: '_id',
        as: 'pkg',
      },
    },
    { $unwind: '$pkg' },
    {
      $group: {
        _id: '$pkg._id',
        subs: { $sum: 1 },
        revenue: { $sum: '$pkg.monthlyPrice' },
        category: { $first: '$pkg.category' },
        packageName: { $first: '$pkg.name' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
  return rows.map((r) => ({
    packageId: String(r._id),
    packageName: r.packageName,
    category: r.category,
    subs: r.subs,
    revenue: r.revenue,
  }));
}

export async function getCategoryRevenue() {
  const mix = await getPackageMix();
  const byCat: Record<string, { subs: number; revenue: number }> = {};
  for (const m of mix) {
    const k = m.category ?? 'personal';
    byCat[k] = byCat[k] ?? { subs: 0, revenue: 0 };
    byCat[k].subs += m.subs;
    byCat[k].revenue += m.revenue;
  }
  return Object.entries(byCat).map(([category, v]) => ({ category, ...v }));
}

export async function getZoneBreakdown() {
  const [subs, tickets] = await Promise.all([
    User.aggregate<{ _id: string; zoneName: string; subs: number; revenue: number }>([
      { $match: { role: 'customer', zone: { $ne: null } } },
      {
        $lookup: {
          from: 'zones',
          localField: 'zone',
          foreignField: '_id',
          as: 'z',
        },
      },
      { $unwind: { path: '$z', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'customer',
          as: 'sub',
        },
      },
      { $unwind: { path: '$sub', preserveNullAndEmptyArrays: true } },
      { $match: { 'sub.status': 'active' } },
      {
        $lookup: {
          from: 'packages',
          localField: 'sub.package',
          foreignField: '_id',
          as: 'pkg',
        },
      },
      { $unwind: { path: '$pkg', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$z._id',
          zoneName: { $first: '$z.name' },
          subs: { $sum: 1 },
          revenue: { $sum: '$pkg.monthlyPrice' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Ticket.aggregate<{ _id: string; zoneName: string; tickets: number }>([
      { $match: { status: { $in: ['open', 'pending'] } } },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: '$u' },
      {
        $lookup: {
          from: 'zones',
          localField: 'u.zone',
          foreignField: '_id',
          as: 'z',
        },
      },
      { $unwind: { path: '$z', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$z._id',
          zoneName: { $first: '$z.name' },
          tickets: { $sum: 1 },
        },
      },
    ]),
  ]);

  const out = subs.map((s) => ({
    zoneId: String(s._id ?? ''),
    zoneName: s.zoneName ?? 'Unassigned',
    subs: s.subs ?? 0,
    revenue: s.revenue ?? 0,
    openTickets:
      tickets.find((t) => String(t._id ?? '') === String(s._id ?? ''))?.tickets ?? 0,
  }));
  return out;
}

// ---------- NOC --------------------------------------------------------------

export async function getNocSummary() {
  const [activeSubs, suspendedSubs, openTickets, packagesCount] = await Promise.all([
    Subscription.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'suspended' }),
    Ticket.countDocuments({ status: { $in: ['open', 'pending'] } }),
    Package.countDocuments({ isActive: true }),
  ]);
  return { activeSubs, suspendedSubs, openTickets, packagesCount };
}

// ---------- CSV helpers ------------------------------------------------------

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}
