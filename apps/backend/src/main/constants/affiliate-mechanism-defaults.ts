/**
 * Affiliate Mechanism — Dynamic Config (Phase 2).
 * Admin chỉnh các tỷ lệ này → service tính hoa hồng/ thưởng mời sẽ đọc DB thay vì hardcode.
 */
export interface IAffiliateCommissionRates {
    /** % hoa hồng nổ hũ + bắn cá (vd 0.3 = 0.3%) */
    slots_fishing: number;
    /** % hoa hồng các sản phẩm còn lại (thể thao, casino live, …) */
    others: number;
    /** % hoa hồng xổ số (mặc định 0) */
    lottery: number;
}

export interface IAffiliateReferralBonus {
    /** Điểm/USDT thưởng người giới thiệu khi referee hợp lệ */
    inviter_reward: number;
    /** Điểm/USDT thưởng người được giới thiệu */
    invitee_reward: number;
    /** Ngưỡng nạp tối thiểu để referee được tính hợp lệ */
    min_deposit: number;
    /** Ngưỡng cược hợp lệ tối thiểu */
    min_valid_bet: number;
}

export interface IAffiliateWithdrawalCondition {
    /** Số vòng cược yêu cầu trước khi rút thưởng affiliate */
    turnover_x: number;
    /** Thời hạn còn hiệu lực để claim/payout (ngày) */
    expiry_days: number;
}

export interface IAffiliateMechanism {
    commission_rates: IAffiliateCommissionRates;
    referral_bonus: IAffiliateReferralBonus;
    /** Tỷ lệ hưởng từ tầng dưới (vd 10 = F2 nhận 10% commission của F1) */
    multi_level_ratio: number;
    withdrawal_condition: IAffiliateWithdrawalCondition;
}

export const DEFAULT_AFFILIATE_MECHANISM: IAffiliateMechanism = {
    commission_rates: {
        slots_fishing: 0.3,
        others: 0.2,
        lottery: 0
    },
    referral_bonus: {
        inviter_reward: 88,
        invitee_reward: 58,
        min_deposit: 1000,
        min_valid_bet: 3000
    },
    multi_level_ratio: 10,
    withdrawal_condition: {
        turnover_x: 1,
        expiry_days: 30
    }
};

const clampPct = (v: unknown, def: number): number => {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
};

const nonNeg = (v: unknown, def: number): number => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return def;
    return n;
};

const posInt = (v: unknown, def: number, min = 1): number => {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n) || n < min) return def;
    return n;
};

/**
 * Merge input (partial từ admin) với DEFAULT, đảm bảo:
 *   - số trong range hợp lệ (% ∈ [0,100], điều kiện ≥ 0, vòng cược ≥ 1, ngày ≥ 1).
 *   - không có field null/undefined leak vào DB.
 */
export function normalizeAffiliateMechanism(
    input: Partial<IAffiliateMechanism> | null | undefined
): IAffiliateMechanism {
    const src: Partial<IAffiliateMechanism> = input || {};
    const rates: Partial<IAffiliateCommissionRates> = src.commission_rates || {};
    const bonus: Partial<IAffiliateReferralBonus> = src.referral_bonus || {};
    const cond: Partial<IAffiliateWithdrawalCondition> = src.withdrawal_condition || {};
    return {
        commission_rates: {
            slots_fishing: clampPct(rates.slots_fishing, DEFAULT_AFFILIATE_MECHANISM.commission_rates.slots_fishing),
            others: clampPct(rates.others, DEFAULT_AFFILIATE_MECHANISM.commission_rates.others),
            lottery: clampPct(rates.lottery, DEFAULT_AFFILIATE_MECHANISM.commission_rates.lottery)
        },
        referral_bonus: {
            inviter_reward: nonNeg(bonus.inviter_reward, DEFAULT_AFFILIATE_MECHANISM.referral_bonus.inviter_reward),
            invitee_reward: nonNeg(bonus.invitee_reward, DEFAULT_AFFILIATE_MECHANISM.referral_bonus.invitee_reward),
            min_deposit: nonNeg(bonus.min_deposit, DEFAULT_AFFILIATE_MECHANISM.referral_bonus.min_deposit),
            min_valid_bet: nonNeg(bonus.min_valid_bet, DEFAULT_AFFILIATE_MECHANISM.referral_bonus.min_valid_bet)
        },
        multi_level_ratio: clampPct(src.multi_level_ratio, DEFAULT_AFFILIATE_MECHANISM.multi_level_ratio),
        withdrawal_condition: {
            turnover_x: posInt(cond.turnover_x, DEFAULT_AFFILIATE_MECHANISM.withdrawal_condition.turnover_x, 1),
            expiry_days: posInt(cond.expiry_days, DEFAULT_AFFILIATE_MECHANISM.withdrawal_condition.expiry_days, 1)
        }
    };
}
