import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import referralCodeService from '@main/services/referral-code.service';
import balanceService from '@main/services/balance.service';
import userService from '@main/services/user.service';
import currencyService from '@main/services/currency.service';
import transactionService from '@main/services/transaction.service';
import settingService from '@main/services/setting.service';
import UserModel from '@main/models/user.model';
import type { IReagentEnrollment, IReagentEnrollmentCondition } from '@main/constants/reagent-page-defaults';
import { mergeReagentPage } from '@main/constants/reagent-page-defaults';

async function enrollmentConfig(): Promise<IReagentEnrollment> {
    const doc = await settingService.getSetting();
    return mergeReagentPage(doc?.reagentPage as never).enrollment;
}

export async function hasLegacyReferralAccess(userId: string): Promise<boolean> {
    const codes = await referralCodeService.getReferralCodes(String(userId));
    return Array.isArray(codes) && codes.length > 0;
}

export async function passesReagentGate(userLean: Record<string, unknown>, userId: string): Promise<boolean> {
    const cfg = await enrollmentConfig();
    if (!cfg.gateEnabled) return true;
    if (userLean?.reagentEnrolled === true) return true;
    return hasLegacyReferralAccess(userId);
}

function evalOne(
    c: IReagentEnrollmentCondition,
    balance: { amount: number; turnover: number },
    user: Record<string, unknown>
): boolean {
    switch (c.type) {
        case 'min_balance':
            return balance.amount >= c.value;
        case 'min_turnover':
            return balance.turnover >= c.value;
        case 'min_deposit_count':
            return Number(user.depositCount ?? 0) >= c.value;
        case 'min_vip_xp':
            return Number(user.vipXp ?? 0) >= c.value;
        case 'kyc_verified':
            return Boolean(user.kycVerified) === (c.value >= 1);
        default:
            return false;
    }
}

export function conditionsPassed(
    enrollment: IReagentEnrollment,
    balance: { amount: number; turnover: number },
    user: Record<string, unknown>
): boolean {
    const active = enrollment.conditions.filter((x) => x.enabled);
    if (!active.length) return true;
    return active.every((c) => evalOne(c, balance, user));
}

export async function enrollmentChecklist(enrollment: IReagentEnrollment, userId: string) {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    const balance = await balanceService.getBalanceByUserId(String(user._id));
    const b = balance
        ? { amount: Number(balance.amount ?? 0), turnover: Number(balance.turnover ?? 0) }
        : { amount: 0, turnover: 0 };
    const u = user as unknown as Record<string, unknown>;

    const active = enrollment.conditions.filter((c) => c.enabled);
    return {
        conditions: active.map((c) => ({
            id: c.id,
            type: c.type,
            labelVi: c.labelVi ?? '',
            value: c.value,
            satisfied: evalOne(c, b, u)
        })),
        allConditionsOk: active.length === 0 || active.every((c) => evalOne(c, b, u)),
        balanceMain: b.amount
    };
}

export async function getPublicEnrollmentStatus(authUser?: Record<string, unknown> | null) {
    const enrollment = await enrollmentConfig();
    const gateActive = enrollment.gateEnabled === true;

    if (!authUser?._id) {
        return {
            gateActive,
            enrollment,
            enrolled: false,
            grandfathered: false,
            canJoinNow: false,
            needsLogin: true
        };
    }

    const userId = String(authUser._id);
    const legacy = await hasLegacyReferralAccess(userId);
    const enrolledFlag = Boolean(authUser.reagentEnrolled);

    const agencyBalance = Number(authUser?.agencyBalance ?? 0);

    if (!gateActive) {
        return {
            gateActive,
            enrollment,
            enrolled: true,
            grandfathered: legacy,
            canJoinNow: true,
            balance: agencyBalance,
            needsLogin: false
        };
    }
    if (enrolledFlag || legacy) {
        return {
            gateActive,
            enrollment,
            enrolled: enrolledFlag,
            grandfathered: legacy && !enrolledFlag,
            canJoinNow: true,
            balance: agencyBalance,
            needsLogin: false
        };
    }

    const chk = await enrollmentChecklist(enrollment, userId);
    const feeAmt = Math.max(0, Number(enrollment.feeAmount ?? 0));
    const needsFeeCharge = enrollment.feeEnabled && feeAmt > 0;
    const feePaidOk = needsFeeCharge ? chk.balanceMain >= feeAmt : true;
    const canJoinNow = chk.allConditionsOk && feePaidOk;

    return {
        gateActive,
        enrollment,
        enrolled: false,
        grandfathered: false,
        canJoinNow,
        balance: agencyBalance,
        checklist: chk.conditions,
        feePreview: enrollment.feeEnabled
            ? { amount: feeAmt, description: enrollment.feeDescriptionVi }
            : null,
        needsLogin: false
    };
}

export async function joinReagentProgram(userIdStr: string) {
    const user = await UserModel.findById(userIdStr);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    const u = user.toObject() as unknown as Record<string, unknown>;

    const enrollment = await enrollmentConfig();
    if (!enrollment.gateEnabled) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Enrollment gate is disabled');
    }
    if (u.reagentEnrolled === true) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Already enrolled');
    }

    const legacy = await hasLegacyReferralAccess(userIdStr);
    if (legacy) {
        await userService.patchUpdate({ _id: user._id }, { reagentEnrolled: true });
        return { ok: true, legacy: true };
    }

    const balance = await balanceService.getBalanceByUserId(userIdStr);
    if (!balance) throw new ApiError(httpStatus.BAD_REQUEST, 'Balance not found');
    const b = {
        amount: Number(balance.amount ?? 0),
        turnover: Number(balance.turnover ?? 0)
    };

    if (!conditionsPassed(enrollment, b, u)) {
        throw new ApiError(httpStatus.BAD_REQUEST, enrollment.denyMessageVi || 'Điều kiện chưa đủ');
    }

    let afterBalance = balance;
    const feeAmt = Math.max(0, Number(enrollment.feeAmount ?? 0));

    if (enrollment.feeEnabled && feeAmt > 0) {
        const updated = await balanceService.withdrawBalance(String(user._id), -feeAmt);
        if (!updated || Number(updated.amount) < 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Số dư không đủ để đóng phí tham gia');
        }
        afterBalance = updated;
        const currency = await currencyService.getCurrencyById(String(user.currencyId));
        const currencyName = (currency?.name || user.currency || 'USD').toString().toUpperCase();

        await transactionService.createTransaction({
            userId: String(user._id),
            relatedId: String(user._id),
            tnxId: `reagent-fee-${Date.now()}`,
            amount: Number(feeAmt.toFixed(2)),
            beforeAmount: Number(balance.amount.toFixed(2)),
            afterAmount: Number(updated.amount.toFixed(2)),
            currencyName,
            type: 'bonus',
            typeDescription: enrollment.feeDescriptionVi || 'Phí tham gia chương trình đại lý',
            gameName: 'Reagent',
            gameId: 'reagent_enrollment',
            provider: 'platform',
            category: 'payment'
        });

        // Distribute commission recursively to all uplines
        await distributeReagentCommissionRecursive(String(user._id), feeAmt, user, currencyName);
    }

    await userService.patchUpdate(
        { _id: user._id },
        {
            reagentEnrolled: true,
            agencyBalance: feeAmt,
            lockUntil: new Date(Date.now() + 90 * 86400000)
        }
    );

    const storedSocketId = await global.redis.get(String(user._id));
    if (storedSocketId) {
        global.io.to(storedSocketId).emit('balance', {
            amount: afterBalance.amount,
            bonus: afterBalance.bonus,
            pending: afterBalance.pending
        });
    }

    return { ok: true };
}

/**
 * Phân bổ hoa hồng đại lý theo hình thức:
 * - Cấp trên nhận 50% số tiền mà cấp dưới trực tiếp nhận được.
 * - Đệ quy cho đến khi số tiền quá nhỏ hoặc không còn cấp trên.
 */
async function distributeReagentCommissionRecursive(
    currentUserId: string,
    baseAmount: number,
    sourceUser: { _id: any; username: string },
    currencyName: string,
    depth = 0
) {
    if (depth > 20) return; // Bảo vệ chống lặp vô hạn (với 50% thì 20 cấp là cực nhỏ rồi)

    const currentUser = await UserModel.findById(currentUserId);
    if (!currentUser || !currentUser.invitorId) return;

    const commissionAmt = Number((baseAmount * 0.5).toFixed(2));
    if (commissionAmt < 0.01) return;

    const invitorId = String(currentUser.invitorId);
    const invitor = await UserModel.findById(invitorId);
    if (!invitor) return;

    const beforeAmt = invitor.agencyBalance ?? 0;
    const afterAmt = beforeAmt + commissionAmt;
    const unlockAt = new Date(Date.now() + 7 * 86400000);

    await UserModel.updateOne(
        { _id: invitor._id },
        {
            $inc: { agencyBalance: commissionAmt },
            $set: { unlockAt }
        }
    );

    await transactionService.createTransaction({
        userId: invitorId,
        relatedId: String(sourceUser._id),
        tnxId: `reagent-commission-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        amount: commissionAmt,
        beforeAmount: Number(beforeAmt.toFixed(2)),
        afterAmount: Number(afterAmt.toFixed(2)),
        currencyName,
        type: 'commission',
        typeDescription:
            depth === 0
                ? `Hoa hồng giới thiệu đại lý từ ${sourceUser.username}`
                : `Hoa hồng mạng lưới từ ${sourceUser.username} (thông qua ${currentUser.username})`,
        gameName: 'Reagent',
        gameId: 'reagent_referral_commission',
        provider: 'agency',
        category: 'payment'
    });

    // Notify invitor if online
    const invitorSocketId = await global.redis.get(invitorId);
    if (invitorSocketId) {
        global.io.to(invitorSocketId).emit('balance', {
            agencyBalance: afterAmt
        });
    }

    // Đệ quy cho cấp trên nữa: F1 nhận 50% của F2 (vốn đã nhận 50% của F3)
    await distributeReagentCommissionRecursive(invitorId, commissionAmt, sourceUser, currencyName, depth + 1);
}

export async function assertMayCreateReferralCode(userLean: Record<string, unknown>) {
    const ok = await passesReagentGate(userLean, String(userLean._id));
    if (!ok) {
        const cfg = await enrollmentConfig();
        throw new ApiError(httpStatus.FORBIDDEN, cfg.denyMessageVi || 'Bạn chưa đủ điều kiện tham gia chương trình đại lý');
    }
}
