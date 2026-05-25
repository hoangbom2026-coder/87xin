import { planService } from '@main/services/plan.service';
import { Request, Response } from 'express';
import { AuthRequest } from '@middlewares/auth';
import adminAuditService from '@main/services/admin-audit.service';

function normalizePlanPayload(input: Record<string, unknown>) {
  const amountType = Number(input.amountType ?? 0) === 1 ? 1 : 0;
  const minimum = Number(input.minimum ?? 0);
  const maximum = Number(input.maximum ?? 0);
  const amount = Number(input.amount ?? 0);
  const interest = Number(input.interest ?? 0);
  const interestStatus = String(input.interestStatus ?? 'percentage') === 'fixed' ? 'fixed' : 'percentage';
  const times = Number(input.times ?? 5);
  const returnFor = Number(input.returnFor ?? 1) === 0 ? 0 : 1;
  const repeatTime = Number(input.repeatTime ?? 1);
  const capitalBack = Number(input.capitalBack ?? 0) === 1 ? 1 : 0;
  const userInvestLimit = Number(input.userInvestLimit ?? input.limit ?? 1);
  const status = String(input.status ?? 'active') === 'inactive' ? 'inactive' : 'active';
    const features = Array.isArray(input.features)
    ? input.features.map((x) => String(x))
    : String(input.features ?? '')
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);

  const referral =
    input.referral && typeof input.referral === 'object'
      ? {
          levels: Array.isArray((input.referral as any).levels) ? (input.referral as any).levels.map(String) : [],
          commissions: Array.isArray((input.referral as any).commissions)
            ? (input.referral as any).commissions.map(Number)
            : [],
        }
      : undefined;

  return {
    name: String(input.name ?? '').trim(),
    description: String(input.description ?? ''),
    amountType,
    minimum,
    maximum,
    amount,
    interest,
    interestStatus,
    times,
    returnFor,
    repeatTime,
    capitalBack,
    userInvestLimit,
    status,
    features,
    referral,
  };
}

function validatePlanPayload(data: ReturnType<typeof normalizePlanPayload>) {
  if (!data.name) return 'name is required';
  if (!Number.isFinite(data.interest) || data.interest < 0) return 'interest must be >= 0';
  if (!Number.isFinite(data.userInvestLimit) || data.userInvestLimit < 1) return 'userInvestLimit must be >= 1';
  if (data.amountType === 0) {
    if (!Number.isFinite(data.minimum) || !Number.isFinite(data.maximum)) return 'minimum/maximum is invalid';
    if (data.minimum < 0 || data.maximum < 0) return 'minimum/maximum must be >= 0';
    if (data.minimum >= data.maximum) return 'minimum must be less than maximum';
  } else {
    if (!Number.isFinite(data.amount) || data.amount <= 0) return 'amount must be > 0';
  }
  if (data.returnFor === 1) {
    if (!Number.isFinite(data.repeatTime) || data.repeatTime < 1) {
      return 'repeatTime is required when returnFor=period';
    }
  }
  return null;
}

export const planController = {
  async getPlans(_req: Request, res: Response) {
    try {
      const items = await planService.getAll({
        status: (String(_req.query.status || 'all') as 'active' | 'inactive' | 'all'),
        keyword: String(_req.query.keyword || ''),
        page: Number(_req.query.page || 1),
        limit: Number(_req.query.limit || 20),
      });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  },

  async createPlan(req: AuthRequest, res: Response) {
    try {
      const payload = normalizePlanPayload((req.body || {}) as Record<string, unknown>);
      const error = validatePlanPayload(payload);
      if (error) {
        res.status(400).json({ error });
        return;
      }
      const doc = await planService.create(payload as never);
      await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'PLAN_CREATE',
        targetType: 'plan',
        targetId: String(doc._id),
        details: JSON.stringify({ name: doc.name }),
      });
      res.status(201).json(doc);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  },

  async getPlanById(req: Request, res: Response) {
    try {
      const item = await planService.getById((req.params as any).id);
      if (!item) {
        res.status(404).json({ message: 'Plan not found' });
        return;
      }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch plan' });
    }
  },

  async updatePlan(req: AuthRequest, res: Response) {
    try {
      const payload = normalizePlanPayload((req.body || {}) as Record<string, unknown>);
      const error = validatePlanPayload(payload);
      if (error) {
        res.status(400).json({ error });
        return;
      }
      const updated = await planService.update((req.params as any).id, payload as never);
      if (!updated) {
        res.status(404).json({ message: 'Plan not found' });
        return;
      }
      await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'PLAN_UPDATE',
        targetType: 'plan',
        targetId: String(updated._id),
        details: JSON.stringify({ name: updated.name }),
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update plan' });
    }
  },

  async deletePlan(req: AuthRequest, res: Response) {
    try {
      const deleted = await planService.remove((req.params as any).id);
      if (!deleted) {
        res.status(404).json({ message: 'Plan not found' });
        return;
      }
      await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'PLAN_DELETE',
        targetType: 'plan',
        targetId: String(deleted._id),
        details: JSON.stringify({ name: deleted.name }),
      });
      res.json({ message: 'Plan deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete plan' });
    }
  },

  async changeStatus(req: AuthRequest, res: Response) {
    try {
      const updated = await planService.update((req.params as any).id, {
        status: req.body?.status === 'active' ? 'active' : 'inactive',
      });
      if (!updated) {
        res.status(404).json({ message: 'Plan not found' });
        return;
      }
      await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'PLAN_STATUS_CHANGE',
        targetType: 'plan',
        targetId: String(updated._id),
        details: JSON.stringify({ status: updated.status }),
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to change status' });
    }
  },

  async duplicatePlan(req: AuthRequest, res: Response) {
    try {
      const duplicated = await planService.duplicate((req.params as any).id);
      if (!duplicated) {
        res.status(404).json({ message: 'Plan not found' });
        return;
      }
      await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'PLAN_DUPLICATE',
        targetType: 'plan',
        targetId: String(duplicated._id),
        details: JSON.stringify({ name: duplicated.name }),
      });
      res.status(201).json(duplicated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to duplicate plan' });
    }
  },
};
