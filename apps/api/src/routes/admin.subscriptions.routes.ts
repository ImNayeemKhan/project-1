import { Router } from 'express';
import { z } from 'zod';
import { addMonths } from 'date-fns';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Subscription } from '../models/Subscription';
import { Package } from '../models/Package';
import { Router as RouterModel } from '../models/Router';
import { User } from '../models/User';
import { encrypt } from '../utils/crypto';
import { BadRequest, NotFound } from '../utils/errors';
import { mikrotikService } from '../services/mikrotik.service';
import { radiusService } from '../services/radius.service';

export const adminSubscriptionsRouter = Router();
adminSubscriptionsRouter.use(requireAuth, requireRole('admin', 'reseller'));

adminSubscriptionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, customer, q } = req.query as Record<string, string | undefined>;
    const filter: any = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (q) filter.pppoeUsername = new RegExp(q, 'i');
    const items = await Subscription.find(filter)
      .populate('customer', 'name email phone')
      .populate('package', 'name code monthlyPrice downloadMbps uploadMbps')
      .populate('router', 'name host')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ items });
  })
);

const createSchema = z.object({
  customerId: z.string().min(1),
  packageId: z.string().min(1),
  routerId: z.string().optional(),
  pppoeUsername: z.string().min(3),
  pppoePassword: z.string().min(6),
  startDate: z.string().optional(),
});

adminSubscriptionsRouter.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { customerId, packageId, routerId, pppoeUsername, pppoePassword, startDate } = req.body;
    const [customer, pkg, router] = await Promise.all([
      User.findById(customerId),
      Package.findById(packageId),
      routerId ? RouterModel.findById(routerId) : Promise.resolve(null),
    ]);
    if (!customer) throw NotFound('Customer not found');
    if (!pkg) throw NotFound('Package not found');
    if (routerId && !router) throw NotFound('Router not found');

    const start = startDate ? new Date(startDate) : new Date();
    const sub = await Subscription.create({
      customer: customer._id,
      package: pkg._id,
      router: router?._id,
      pppoeUsername,
      pppoePasswordEncrypted: encrypt(pppoePassword),
      status: 'active',
      activatedAt: start,
      nextBillingDate: addMonths(start, 1),
    });

    // Provision on router (dry-run if no router/creds).
    await mikrotikService.addPppoeUser(
      {
        username: pppoeUsername,
        password: pppoePassword,
        profile: pkg.mikrotikProfile || pkg.code,
        comment: `cust:${customer._id}`,
      },
      router
    );

    res.status(201).json({ subscription: sub });
  })
);

const actionSchema = z.object({ action: z.enum(['suspend', 'resume', 'cancel']) });

adminSubscriptionsRouter.post(
  '/:id/action',
  validate(actionSchema),
  asyncHandler(async (req, res) => {
    const sub = await Subscription.findById(req.params.id).populate('router');
    if (!sub) throw NotFound('Subscription not found');
    const router = (sub.router as any) ?? null;

    if (req.body.action === 'suspend') {
      if (sub.status === 'suspended') throw BadRequest('Already suspended');
      await mikrotikService.setPppoeEnabled(sub.pppoeUsername, false, router);
      await radiusService.sendCoA({ username: sub.pppoeUsername, action: 'disconnect' }).catch(() => undefined);
      sub.status = 'suspended';
      sub.suspendedAt = new Date();
    } else if (req.body.action === 'resume') {
      if (sub.status === 'active') throw BadRequest('Already active');
      await mikrotikService.setPppoeEnabled(sub.pppoeUsername, true, router);
      sub.status = 'active';
      sub.suspendedAt = undefined;
    } else if (req.body.action === 'cancel') {
      await mikrotikService.removePppoeUser(sub.pppoeUsername, router).catch(() => undefined);
      sub.status = 'cancelled';
      sub.cancelledAt = new Date();
    }
    await sub.save();
    res.json({ subscription: sub });
  })
);
