import { planService } from '@main/services/plan.service';
import { Request, Response } from 'express';
import { AuthRequest } from '@middlewares/auth';
import adminAuditService from '@main/services/admin-audit.service';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import httpStatus from 'http-status';

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
  getPlans: catchAsync(async (_req: Request, res: Response) => {
    const items = await planService.getAll({
      status: String(_req.query.status || 'all') as 'active' | 'inactive' | 'all',
      keyword: String(_req.query.keyword || ''),
      page: Number(_req.query.page || 1),
      limit: Number(_req.query.limit || 20),
    });
    res.json(items);
  }),

  createPlan: catchAsync(async (req: AuthRequest, res: Response) => {
    const payload = normalizePlanPayload((req.body || {}) as Record<string, unknown>);
    const error = validatePlanPayload(payload);
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error);
    }
    const doc = await planService.create(payload as never);
    await adminAuditService.logAdminAction({
      adminUserId: String(req.user!._id),
      adminUsername: String(req.user!.username ?? ''),
      action: 'PLAN_CREATE',
      targetType: 'plan',
      targetId: String(doc._id),
      details: JSON.stringify({ name: doc.name }),
    });
    res.status(httpStatus.CREATED).json(doc);
  }),

  getPlanById: catchAsync(async (req: Request, res: Response) => {
    const item = await planService.getById((req.params as any).id);
    if (!item) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }
    res.json(item);
  }),

  updatePlan: catchAsync(async (req: AuthRequest, res: Response) => {
    const payload = normalizePlanPayload((req.body || {}) as Record<string, unknown>);
    const error = validatePlanPayload(payload);
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error);
    }
    const updated = await planService.update((req.params as any).id, payload as never);
    if (!updated) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }
    await adminAuditService.logAdminAction({
      adminUserId: String(req.user!._id),
      adminUsername: String(req.user!.username ?? ''),
      action: 'PLAN_UPDATE',
      targetType: 'plan',
      targetId: String(updated._id),
      details: JSON.stringify({ name: updated.name }),
    });
    res.json(updated);
  }),

  deletePlan: catchAsync(async (req: AuthRequest, res: Response) => {
    const deleted = await planService.remove((req.params as any).id);
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }
    await adminAuditService.logAdminAction({
      adminUserId: String(req.user!._id),
      adminUsername: String(req.user!.username ?? ''),
      action: 'PLAN_DELETE',
      targetType: 'plan',
      targetId: String(deleted._id),
      details: JSON.stringify({ name: deleted.name }),
    });
    res.json({ message: 'Plan deleted' });
  }),

  changeStatus: catchAsync(async (req: AuthRequest, res: Response) => {
    const updated = await planService.update((req.params as any).id, {
      status: req.body?.status === 'active' ? 'active' : 'inactive',
    });
    if (!updated) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }
    await adminAuditService.logAdminAction({
      adminUserId: String(req.user!._id),
      adminUsername: String(req.user!.username ?? ''),
      action: 'PLAN_STATUS_CHANGE',
      targetType: 'plan',
      targetId: String(updated._id),
      details: JSON.stringify({ status: updated.status }),
    });
    res.json(updated);
  }),

  duplicatePlan: catchAsync(async (req: AuthRequest, res: Response) => {
    const duplicated = await planService.duplicate((req.params as any).id);
    if (!duplicated) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }
    await adminAuditService.logAdminAction({
      adminUserId: String(req.user!._id),
      adminUsername: String(req.user!.username ?? ''),
      action: 'PLAN_DUPLICATE',
      targetType: 'plan',
      targetId: String(duplicated._id),
      details: JSON.stringify({ name: duplicated.name }),
    });
    res.status(httpStatus.CREATED).json(duplicated);
  }),
};
