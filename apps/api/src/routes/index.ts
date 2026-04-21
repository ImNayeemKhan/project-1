import { Router } from 'express';
import { buildAuthRouter } from './auth.routes';
import { adminUsersRouter } from './admin.users.routes';
import { adminPackagesRouter } from './admin.packages.routes';
import { adminSubscriptionsRouter } from './admin.subscriptions.routes';
import { adminInvoicesRouter } from './admin.invoices.routes';
import { adminRoutersRouter } from './admin.routers.routes';
import { adminZonesRouter } from './admin.zones.routes';
import { adminTicketsRouter } from './admin.tickets.routes';
import { adminLeadsRouter } from './admin.leads.routes';
import { adminAnnouncementsRouter } from './admin.announcements.routes';
import { adminReportsRouter } from './admin.reports.routes';
import { adminBiRouter } from './admin.bi.routes';
import { adminWalletRouter } from './admin.wallet.routes';
import { adminFtpRouter } from './admin.ftp.routes';
import { adminAddonsRouter } from './admin.addons.routes';
import { adminWebhooksRouter } from './admin.webhooks.routes';
import { customerRouter } from './customer.routes';
import { customerTicketsRouter } from './customer.tickets.routes';
import { customerAnnouncementsRouter } from './customer.announcements.routes';
import { customerFtpRouter } from './customer.ftp.routes';
import { buildPaymentsRouter } from './payments.routes';
import { publicRouter } from './public.routes';
import { healthRouter } from './health.routes';
import type { RateLimiters } from '../middleware/rateLimit';

export function buildApiRouter(limiters: RateLimiters) {
  const apiRouter = Router();

  apiRouter.use('/health', healthRouter);
  apiRouter.use('/public', publicRouter);
  apiRouter.use('/auth', buildAuthRouter(limiters.auth));
  apiRouter.use('/admin/users', adminUsersRouter);
  apiRouter.use('/admin/packages', adminPackagesRouter);
  apiRouter.use('/admin/subscriptions', adminSubscriptionsRouter);
  apiRouter.use('/admin/invoices', adminInvoicesRouter);
  apiRouter.use('/admin/routers', adminRoutersRouter);
  apiRouter.use('/admin/zones', adminZonesRouter);
  apiRouter.use('/admin/tickets', adminTicketsRouter);
  apiRouter.use('/admin/leads', adminLeadsRouter);
  apiRouter.use('/admin/announcements', adminAnnouncementsRouter);
  apiRouter.use('/admin/reports', adminReportsRouter);
  apiRouter.use('/admin/bi', adminBiRouter);
  apiRouter.use('/admin/wallet', adminWalletRouter);
  apiRouter.use('/admin/ftp-servers', adminFtpRouter);
  apiRouter.use('/admin/addons', adminAddonsRouter);
  apiRouter.use('/admin/webhooks', adminWebhooksRouter);
  apiRouter.use('/customer', customerRouter);
  apiRouter.use('/customer/tickets', customerTicketsRouter);
  apiRouter.use('/customer/announcements', customerAnnouncementsRouter);
  apiRouter.use('/customer/ftp', customerFtpRouter);
  apiRouter.use('/payments', buildPaymentsRouter(limiters.payment));

  return apiRouter;
}
