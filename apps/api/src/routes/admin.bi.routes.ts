import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getMrr,
  getArpu,
  getChurnRate,
  getCohortRetention,
  getRevenueTrend,
  getMonthlyRevenueSeries,
  getArAging,
  getCollectionEfficiency,
  getFailedPaymentBreakdown,
  getPackageMix,
  getCategoryRevenue,
  getZoneBreakdown,
  getNocSummary,
  toCsv,
} from '../services/analytics.service';

export const adminBiRouter = Router();
adminBiRouter.use(requireAuth, requireRole('admin'));

/**
 * Headline KPIs for the BI dashboard. One chatty endpoint on purpose so the
 * dashboard renders in a single fetch instead of eight.
 */
adminBiRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [
      mrr,
      arpu,
      churnRate,
      monthly,
      trend,
      aging,
      collection,
      failed,
      mix,
      cats,
      zones,
      noc,
    ] = await Promise.all([
      getMrr(),
      getArpu(),
      getChurnRate(),
      getMonthlyRevenueSeries(12),
      getRevenueTrend(30),
      getArAging(),
      getCollectionEfficiency(),
      getFailedPaymentBreakdown(),
      getPackageMix(),
      getCategoryRevenue(),
      getZoneBreakdown(),
      getNocSummary(),
    ]);
    res.json({
      kpis: {
        mrr,
        arr: mrr * 12,
        arpu: +arpu.toFixed(2),
        churnRate,
        collectionEfficiency: collection,
      },
      revenue: { monthly, daily: trend },
      ar: { aging, failedPayments: failed },
      mix: { byPackage: mix, byCategory: cats },
      zones,
      noc,
    });
  })
);

adminBiRouter.get(
  '/cohort-retention',
  asyncHandler(async (req, res) => {
    const months = Math.min(12, Math.max(3, Number(req.query.months) || 6));
    res.json({ items: await getCohortRetention(months) });
  })
);

adminBiRouter.get(
  '/export/revenue.csv',
  asyncHandler(async (_req, res) => {
    const monthly = await getMonthlyRevenueSeries(12);
    res.type('text/csv').attachment('revenue-monthly.csv').send(toCsv(monthly));
  })
);

adminBiRouter.get(
  '/export/aging.csv',
  asyncHandler(async (_req, res) => {
    const aging = await getArAging();
    res.type('text/csv').attachment('ar-aging.csv').send(toCsv(aging));
  })
);

adminBiRouter.get(
  '/export/mix.csv',
  asyncHandler(async (_req, res) => {
    const mix = await getPackageMix();
    res.type('text/csv').attachment('package-mix.csv').send(toCsv(mix));
  })
);

adminBiRouter.get(
  '/export/zones.csv',
  asyncHandler(async (_req, res) => {
    const zones = await getZoneBreakdown();
    res.type('text/csv').attachment('zone-breakdown.csv').send(toCsv(zones));
  })
);
