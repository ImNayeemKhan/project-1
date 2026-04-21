import { Router } from 'express';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { Ticket } from '../models/Ticket';

export const adminReportsRouter = Router();
adminReportsRouter.use(requireAuth, requireRole('admin', 'reseller'));

// High-level KPIs for the admin dashboard.
adminReportsRouter.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const last30 = subDays(now, 30);

    const [
      totalCustomers,
      activeSubs,
      suspendedSubs,
      openTickets,
      unpaidInvoices,
      overdueInvoices,
      revenueThisMonthAgg,
      revenueLast30Agg,
      newCustomersLast30,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'suspended' }),
      Ticket.countDocuments({ status: { $in: ['open', 'pending'] } }),
      Invoice.countDocuments({ status: 'unpaid' }),
      Invoice.countDocuments({ status: 'overdue' }),
      Payment.aggregate([
        { $match: { status: 'success', processedAt: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success', processedAt: { $gte: last30 } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({ role: 'customer', createdAt: { $gte: last30 } }),
    ]);

    res.json({
      totals: {
        totalCustomers,
        activeSubs,
        suspendedSubs,
        openTickets,
        unpaidInvoices,
        overdueInvoices,
        newCustomersLast30,
      },
      revenue: {
        currentMonth: revenueThisMonthAgg[0]?.total ?? 0,
        last30Days: revenueLast30Agg[0]?.total ?? 0,
      },
    });
  })
);

// Aging report — outstanding invoices bucketed by how overdue they are.
adminReportsRouter.get(
  '/aging',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const buckets = [
      { label: '0-30', from: 0, to: 30 },
      { label: '31-60', from: 31, to: 60 },
      { label: '61-90', from: 61, to: 90 },
      { label: '90+', from: 91, to: 3650 },
    ];
    const results = await Promise.all(
      buckets.map(async (b) => {
        const toDate = subDays(now, b.from);
        const fromDate = subDays(now, b.to);
        const agg = await Invoice.aggregate([
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
    res.json({ buckets: results });
  })
);

// Revenue trend — daily revenue for the last 30 days.
adminReportsRouter.get(
  '/revenue-trend',
  asyncHandler(async (_req, res) => {
    const from = subDays(new Date(), 30);
    const items = await Payment.aggregate([
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
    res.json({ items });
  })
);
