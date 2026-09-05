import httpStatus from 'http-status';
import { Request, Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import affiliateService from '@main/services/affiliate.service';
import { generateReferral } from '@utils/utils';
import { AFFILIATE_ROLE } from '@config/static';
import { AuthRequest } from '@middlewares/auth';
import affiliatePayoutService from '@main/services/affiliate-payout.service';
import settingService from '@main/services/setting.service';
import affiliateLogService from '@main/services/affiliate-log.service';
import affiliateMechanismService from '@main/services/affiliate-mechanism.service';
import type { IAffiliateMechanism } from '@main/constants/affiliate-mechanism-defaults';

export const createRootAffiliate = catchAsync(async (req: AuthRequest, res: Response) => {
  const admin = req.user;
  if (!admin || admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const { email, username, firstName, lastName, password } = req.body as {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  };

  if (!email || !username || !firstName || !lastName || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }

  if (await affiliateService.emailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await affiliateService.usernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }

  let referral = generateReferral(9, false);
  let exists = await affiliateService.getAffiliateByReferralCode(referral);
  while (exists) {
    referral = generateReferral(9, false);
    exists = await affiliateService.getAffiliateByReferralCode(referral);
  }

  const payload: any = {
    username: String(username).toLowerCase().replaceAll(' ', ''),
    email: String(email).toLowerCase().replaceAll(' ', ''),
    firstName,
    lastName,
    password,
    referralCode: referral,
    role: AFFILIATE_ROLE[0], // 'company'
    status: 'active',
    path: [],
  };

  const affiliate = await affiliateService.createAffiliate(payload);
  return res.status(httpStatus.CREATED).send({ affiliate });
});

/** One-shot auto-payout sweep (uses minThreshold from body/query or from settings). */
export const runAffiliateAutoPayout = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user!.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const raw = (req.body?.minThreshold ?? req.query?.minThreshold) as unknown;
  let min = raw !== undefined && raw !== '' ? Number(raw) : NaN;
  if (Number.isNaN(min)) {
    const doc = await settingService.getSetting();
    min = Number(doc?.affiliateProgram?.autoPayout?.minThreshold ?? 0);
  }
  const results = await affiliatePayoutService.runAutoPayout(min);
  return res.send({ ok: true, count: results.length, results });
});

/** GET /api/admin/affiliate/reward-logs — toàn hệ thống (admin). */
export const listAdminAffiliateRewardLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || !['admin', 'owner'].includes(String(req.user!.role))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const type = req.query.type === 'referral' ? 'referral' : 'commission';
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
  const invitorUsername =
    typeof req.query.invitorUsername === 'string' ? req.query.invitorUsername : undefined;
  const { data, total } = await affiliateLogService.listAdminRewardLogs({
    type,
    invitorUsername,
    page,
    limit
  });
  return res.send({ data, total, page, limit });
});

/** GET /api/admin/affiliate/mechanism — đọc Dynamic Config Affiliate. */
export const getAffiliateMechanismConfig = catchAsync(async (_req: Request, res: Response) => {
  const value = await affiliateMechanismService.getAffiliateMechanism(true);
  return res.send({ value, defaults: affiliateMechanismService.DEFAULT_AFFILIATE_MECHANISM });
});

/** POST /api/admin/affiliate/mechanism — cập nhật Dynamic Config + audit log + bust cache. */
export const updateAffiliateMechanismConfig = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || !['admin', 'owner'].includes(String(req.user!.role))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const input = (req.body?.value ?? req.body ?? {}) as Partial<IAffiliateMechanism>;
  const value = await affiliateMechanismService.updateAffiliateMechanism({
    adminUserId: String(req.user!._id ?? req.user!.id ?? ''),
    adminUsername: String(req.user!.username ?? req.user!.email ?? 'admin'),
    input
  });
  return res.send({ success: true, message: 'Cập nhật cơ chế Affiliate thành công!', value });
});

export default { createRootAffiliate };
