import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AffiliateAuthRequest } from '@middlewares/affiliate-auth';
// service
import affiliateService from '@main/services/affiliate.service';
import userService from '@main/services/user.service';
import settingService from '@main/services/setting.service';

export const updatePassword = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!(await req.affiliate.isPasswordMatch(oldPassword))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
    }
    await affiliateService.updatePassword(String(req.affiliate._id), newPassword);
    return res.status(httpStatus.NO_CONTENT).send();
});

export const updateAffiliate = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const data = req.body;
    const affiliateId = req.affiliate._id;

    if (await affiliateService.emailTaken(data.email, affiliateId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exist');
    }
    if (await affiliateService.usernameTaken(data.username, affiliateId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Username already exist');
    }
    const affiliate = await affiliateService.patchUpdate({ _id: affiliateId }, data);
    return res.send(affiliate);
});

export const referralCount = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;

    const affiliates = await affiliateService.getAffiliateByparentId(affiliateId);
    const users = await userService.getUserByinvitorId(affiliateId);
    const activeAffiliates = affiliates.filter((a) => a.status === 'active').length;
    const activeUsers = users.filter((u) => u.status === 'active').length;

    const affiliate = {
        all: affiliates.length,
        active: activeAffiliates,
        inactive: affiliates.length - activeAffiliates
    };

    const user = {
        all: users.length,
        active: activeUsers,
        inactive: users.length - activeUsers
    };

    return res.send({ affiliate, user });
});

export const getDashboard = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;
    const duration = req.query.duration || 'all';

    const dashboard = await affiliateService.getDashboard({
        parentId: String(affiliateId),
        duration: String(duration)
    });
    const user = await userService.getAffiliateUsers({
        parentId: String(affiliateId),
        duration: String(duration)
    });
    const data: any = { user };
    dashboard.forEach((d) => {
        data[d._id] = d.count;
    });
    return res.send(data);
});

export const getDashboardAnalysis = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;
    const data = await affiliateService.getAnalysis(affiliateId, req.body);

    const setting = await settingService.getSetting();

    const result = { win: 0, bet: 0 };

    for (const item of data) {
        const { type, currency, total } = item;
        const rate = setting.rates[currency] || 0;
        if (result[type] !== undefined) {
            result[type] += total * rate;
        }
    }
    return res.send(result);
});

export const getDashboardChildren = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;
    const data = await affiliateService.getDashboardChildren(affiliateId, req.body);
    return res.send(data);
});

export const getChildrenAffiliate = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;
    const data = await affiliateService.getChildrenAffiliate(String(affiliateId), req.body);
    return res.send(data);
});

export const getAffiliateUsers = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;
    const data = await affiliateService.getAffiliateUsers(String(affiliateId), req.body);
    return res.send(data);
});

export const getTreeAffiliate = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const affiliateId = req.affiliate._id;
    const data = await affiliateService.getTreeAffiliate(String(affiliateId));
    return res.send(data);
});

export const getCommission = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const setting = await settingService.getSetting();
    return res.send(setting.commission);
});

export const updateCommission = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const setting = await settingService.updateSetting({ commission: req.body });
    return res.send(setting.commission);
});
