/** Nội dung trang /reagent (đại lý) — merge với settings.reagentPage. Đồng bộ admin/client/lib khi sửa mặc định. */

export const REAGENT_CONDITION_TYPES = [
    'min_balance',
    'min_turnover',
    'min_deposit_count',
    'kyc_verified',
    'min_vip_xp'
] as const;

export type ReagentEnrollmentConditionType = (typeof REAGENT_CONDITION_TYPES)[number];

/** Một điều kiện tham gia (admin bật/tắt, chỉnh value, thêm/xoá). */
export interface IReagentEnrollmentCondition {
    id: string;
    type: ReagentEnrollmentConditionType;
    enabled: boolean;
    /** Giới hạn số nhỏ nhất áp vào chỉ tiêu tương ứng; với kyc_verified thì ≥1 = bắt buộc đã KYC */
    value: number;
    /** Nhãn hiển thị tuỳ chọn (landing / checklist) */
    labelVi?: string;
}

/** Kiểm soát người chơi trước khi được tạo mã giới thiệu / tham gia chương trình đại lý hiển thị từ /reagent */
export interface IReagentEnrollment {
    gateEnabled: boolean;
    feeEnabled: boolean;
    feeAmount: number;
    feeDescriptionVi: string;
    /** Thông báo khi chưa đủ điều kiện (landing + API). */
    denyMessageVi: string;
    conditions: IReagentEnrollmentCondition[];
}

export interface IAdvancedInvestmentTier {
    id: string;
    minDeposit: number;
    interestRate: number;
}

export interface IReagentInvestmentCore {
    baseOvernightRate: number;
    capitalLockDays: number;
    interestCycle: 'daily' | 'weekly';
    advancedTiers: IAdvancedInvestmentTier[];
}

export interface IReagentCommissionMatrix {
    directCommissionPct: number;
    indirectCommissionPct: number;
    commissionLockDays: number;
    managementBonusPct: number;
}

export interface IReagentEligibilityControl {
    minDepositVnd: number;
    minTurnoverVnd: number;
    requiredTurnoverX: number;
    autoApproveAgency: boolean;
}

export interface IReagentContentSeo {
    bannerDesktopMobile: string;
    introVideoUrl: string;
    rulesRichText: string;
    invitePopupEnabled: boolean;
}

export interface IReagentPage {
    bannerTitle: string;
    bannerSubtitle: string;
    backgroundUrl: string;
    midBannerUrl: string;
    ctaLabel: string;
    ctaHref: string;
    stats: { value: string; label: string }[];
    programTitle: string;
    programHeaders: { level: string; players: string; commission: string };
    programRows: { level: number; players: string; commission: string }[];
    faqTitle: string;
    faqItems: { id: string; question: string; answer: string }[];
    enrollment: IReagentEnrollment;
    investmentCore?: IReagentInvestmentCore;
    commissionMatrix?: IReagentCommissionMatrix;
    eligibilityControl?: IReagentEligibilityControl;
    contentSeo?: IReagentContentSeo;
}

export const DEFAULT_REAGENT_ENROLLMENT: IReagentEnrollment = {
    gateEnabled: true,
    feeEnabled: true,
    feeAmount: 2500000,
    feeDescriptionVi: 'Phí tham gia chương trình đại lý / giới thiệu',
    denyMessageVi:
        'Bạn chưa đủ điều kiện tham gia chương trình đại lý. Vui lòng nạp đủ 2.500.000đ vào tài khoản chính và hoàn thành các chỉ tiêu yêu cầu bên dưới.',
    conditions: []
};

export const DEFAULT_REAGENT_PAGE: IReagentPage = {
    bannerTitle: 'Hợp tác đại lý',
    bannerSubtitle:
        'Kiếm hoa hồng khi giới thiệu người chơi — hệ thống đa cấp, báo cáo minh bạch, hỗ trợ đối tác.',
    backgroundUrl: '/images/promotions/default.webp',
    midBannerUrl: '/images/promotions/hxpl-banner.webp',
    ctaLabel: 'Tham gia ngay',
    ctaHref: '/affiliate/dashboard',
    stats: [
        { value: '50%', label: 'Hoa hồng trọn đời từ phí tham gia cấp dưới' },
        { value: '2.5Tr', label: 'Phí tham gia — nhận quyền đại lý vĩnh viễn' },
        { value: '∞', label: 'Không giới hạn tầng nhận thưởng mạng lưới' }
    ],
    programTitle: 'Chính sách đại lý',
    programHeaders: {
        level: 'Tầng mạng lưới',
        players: 'Mô tả nguồn thu',
        commission: 'Tỷ lệ hưởng'
    },
    programRows: [
        { level: 1, players: 'Giới thiệu trực tiếp (F1)', commission: '50%' },
        { level: 2, players: 'Mạng lưới F2 (qua F1)', commission: '50%' },
        { level: 3, players: 'Mạng lưới F3 (qua F2)', commission: '50%' },
        { level: 4, players: 'Và các tầng tiếp theo...', commission: '50%' }
    ],
    faqTitle: 'Câu hỏi thường gặp',
    faqItems: [
        {
            id: '1',
            question: 'Làm sao để trở thành đại lý?',
            answer: 'Bạn chỉ cần thanh toán phí tham gia 2.500.000đ một lần duy nhất để sở hữu quyền đại lý vĩnh viễn và bắt đầu xây dựng mạng lưới.'
        },
        {
            id: '2',
            question: 'Hoa hồng được tính như thế nào?',
            answer: 'Bạn nhận ngay 50% phí tham gia từ thành viên trực tiếp (F1). Đồng thời nhận 50% từ số tiền mà cấp dưới của bạn nhận được từ mạng lưới của họ — đệ quy không giới hạn tầng.'
        },
        {
            id: '3',
            question: 'Tôi có cần duy trì doanh số không?',
            answer: 'Không. Sau khi đóng phí 2.500.000đ, tài khoản đại lý của bạn là vĩnh viễn, không áp lực doanh số, hưởng hoa hồng trọn đời từ mạng lưới.'
        },
        {
            id: '4',
            question: 'Làm sao để rút hoa hồng?',
            answer: 'Hoa hồng được cộng trực tiếp vào ví đại lý của bạn ngay khi có phát sinh từ mạng lưới. Bạn có thể rút về tài khoản ngân hàng bất cứ lúc nào khi đạt ngưỡng tối thiểu.'
        }
    ],
    enrollment: { ...DEFAULT_REAGENT_ENROLLMENT },
    investmentCore: {
        baseOvernightRate: 5,
        capitalLockDays: 90,
        interestCycle: 'daily',
        advancedTiers: [
            { id: 't1', minDeposit: 50000000, interestRate: 15 },
            { id: 't2', minDeposit: 200000000, interestRate: 30 }
        ]
    },
    commissionMatrix: {
        directCommissionPct: 50,
        indirectCommissionPct: 50,
        commissionLockDays: 7,
        managementBonusPct: 10
    },
    eligibilityControl: {
        minDepositVnd: 1000000,
        minTurnoverVnd: 3000000,
        requiredTurnoverX: 1,
        autoApproveAgency: true
    },
    contentSeo: {
        bannerDesktopMobile: '/images/promotions/default.webp',
        introVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rulesRichText: '<p>Các quy tắc và điều khoản khi tham gia hệ thống Đại lý: Tuân thủ quy định hệ thống, không gian lận doanh thu.</p>',
        invitePopupEnabled: false
    }
};

const COND_ALLOWED = new Set<string>(REAGENT_CONDITION_TYPES);

function sanitizeEnrollmentCondition(raw: Partial<IReagentEnrollmentCondition>): IReagentEnrollmentCondition | null {
    if (!raw?.id || typeof raw.id !== 'string') return null;
    const t = String(raw.type || '');
    const type = (COND_ALLOWED.has(t) ? t : '') as ReagentEnrollmentConditionType;
    if (!type) return null;
    const row: IReagentEnrollmentCondition = {
        id: raw.id.trim().slice(0, 80),
        type,
        enabled: Boolean(raw.enabled),
        value: Math.max(0, Number(raw.value) || 0)
    };
    if (typeof raw.labelVi === 'string' && raw.labelVi.trim()) {
        row.labelVi = raw.labelVi.trim().slice(0, 200);
    }
    return row;
}

export function mergeReagentEnrollment(
    partial: Partial<IReagentEnrollment> | null | undefined,
    base: IReagentEnrollment = DEFAULT_REAGENT_ENROLLMENT
): IReagentEnrollment {
    if (!partial || typeof partial !== 'object') {
        return {
            ...base,
            conditions: base.conditions.map((c) => ({ ...c }))
        };
    }
    const mergedConds = Array.isArray(partial.conditions)
        ? (partial.conditions
              .map((c) => sanitizeEnrollmentCondition(c))
              .filter(Boolean) as IReagentEnrollmentCondition[])
        : base.conditions.map((c) => ({ ...c }));
    return {
        gateEnabled:
            partial.gateEnabled !== undefined ? Boolean(partial.gateEnabled) : base.gateEnabled,
        feeEnabled: partial.feeEnabled !== undefined ? Boolean(partial.feeEnabled) : base.feeEnabled,
        feeAmount:
            partial.feeAmount !== undefined
                ? Math.max(0, Math.min(Number(partial.feeAmount) || 0, 1e12))
                : base.feeAmount,
        feeDescriptionVi:
            typeof partial.feeDescriptionVi === 'string'
                ? partial.feeDescriptionVi.trim().slice(0, 500)
                : base.feeDescriptionVi,
        denyMessageVi:
            typeof partial.denyMessageVi === 'string'
                ? partial.denyMessageVi.trim().slice(0, 2000)
                : base.denyMessageVi,
        conditions: (mergedConds as IReagentEnrollmentCondition[]).slice(0, 30)
    };
}

export function mergeReagentPage(
    partial: Partial<IReagentPage> | null | undefined,
    base: IReagentPage = DEFAULT_REAGENT_PAGE
): IReagentPage {
    if (!partial || typeof partial !== 'object') return { ...base, enrollment: mergeReagentEnrollment(null) };
    const baseInv = base.investmentCore || DEFAULT_REAGENT_PAGE.investmentCore;
    const partInv = partial.investmentCore;
    return {
        ...base,
        ...partial,
        programHeaders: { ...base.programHeaders, ...(partial.programHeaders || {}) },
        stats: Array.isArray(partial.stats) ? partial.stats : base.stats,
        programRows: Array.isArray(partial.programRows) ? partial.programRows : base.programRows,
        faqItems: Array.isArray(partial.faqItems) ? partial.faqItems : base.faqItems,
        enrollment: mergeReagentEnrollment(
            typeof partial.enrollment === 'object' && partial.enrollment !== null ? partial.enrollment : undefined
        ),
        investmentCore: {
            ...(baseInv as IReagentInvestmentCore),
            ...(partInv || {}),
            advancedTiers: Array.isArray(partInv?.advancedTiers)
                ? partInv.advancedTiers
                : (baseInv?.advancedTiers || [])
        },
        commissionMatrix: {
            ...(base.commissionMatrix || DEFAULT_REAGENT_PAGE.commissionMatrix as IReagentCommissionMatrix),
            ...(partial.commissionMatrix || {})
        },
        eligibilityControl: {
            ...(base.eligibilityControl || DEFAULT_REAGENT_PAGE.eligibilityControl as IReagentEligibilityControl),
            ...(partial.eligibilityControl || {})
        },
        contentSeo: {
            ...(base.contentSeo || DEFAULT_REAGENT_PAGE.contentSeo as IReagentContentSeo),
            ...(partial.contentSeo || {})
        }
    };
}
