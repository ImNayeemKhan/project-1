import { Router } from 'express';
import { authRouter } from './auth.routes';
import { adminUsersRouter } from './admin.users.routes';
import { adminPackagesRouter } from './admin.packages.routes';
import { adminSubscriptionsRouter } from './admin.subscriptions.routes';
import { adminInvoicesRouter } from './admin.invoices.routes';
import { adminRoutersRouter } from './admin.routers.routes';
import { customerRouter } from './customer.routes';
import { paymentsRouter } from './payments.routes';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/users', adminUsersRouter);
apiRouter.use('/admin/packages', adminPackagesRouter);
apiRouter.use('/admin/subscriptions', adminSubscriptionsRouter);
apiRouter.use('/admin/invoices', adminInvoicesRouter);
apiRouter.use('/admin/routers', adminRoutersRouter);
apiRouter.use('/customer', customerRouter);
apiRouter.use('/payments', paymentsRouter);
