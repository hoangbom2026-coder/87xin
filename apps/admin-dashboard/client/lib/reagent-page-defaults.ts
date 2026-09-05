/** Nội dung trang /reagent — đồng bộ backend/src/main/constants/reagent-page-defaults.ts */

export const REAGENT_CONDITION_TYPES = [
    "min_balance",
    "min_turnover",
    "min_deposit_count",
    "kyc_verified",
    "min_vip_xp",
] as const;

export type ReagentEnrollmentConditionType = (typeof REAGENT_CONDITION_TYPES)[number];

export interface IReagentEnrollmentCondition {
    id: string;
    type: ReagentEnrollmentConditionType;
    enabled: boolean;
    value: number;
    labelVi?: string;
}

export interface IReagentEnrollment {
    gateEnabled: boolean;
    feeEnabled: boolean;
    feeAmount: number;
    feeDescriptionVi: string;
    denyMessageVi: string;
    conditions: IReagentEnrollmentCondition[];
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
}

export const DEFAULT_REAGENT_ENROLLMENT: IReagentEnrollment = {
    gateEnabled: true,
    feeEnabled: true,
    feeAmount: 2500000,
    feeDescriptionVi: "Phí tham gia chương trình đại lý / giới thiệu",
    denyMessageVi:
        "Bạn chưa đủ điều kiện tham gia chương trình đại lý. Vui lòng hoàn thành các yêu cầu bên dưới.",
    conditions: [],
};

export const DEFAULT_REAGENT_PAGE: IReagentPage = {
    bannerTitle: "Hợp tác đại lý",
    bannerSubtitle:
        "Kiếm hoa hồng khi giới thiệu người chơi — hệ thống đa cấp, báo cáo minh bạch, hỗ trợ đối tác.",
    backgroundUrl: "/images/promotions/default.webp",
    midBannerUrl: "/images/promotions/hxpl-banner.webp",
    ctaLabel: "Tham gia ngay",
    ctaHref: "/affiliate/dashboard",
    stats: [
        { value: "50%", label: "Hoa hồng chia sẻ doanh thu (tham khảo)" },
        { value: "Trọn đời", label: "Thu nhập trên người được giới thiệu hoạt động" },
        { value: "24/7", label: "Hỗ trợ & vận hành" },
    ],
    programTitle: "Chi tiết chương trình (minh họa)",
    programHeaders: {
        level: "Cấp độ",
        players: "Người chơi hoạt động",
        commission: "Tỷ lệ hoa hồng",
    },
    programRows: [
        { level: 1, players: "≥ 5", commission: "30%" },
        { level: 2, players: "≥ 10", commission: "35%" },
        { level: 3, players: "≥ 20", commission: "40%" },
        { level: 4, players: "≥ 30", commission: "50%" },
    ],
    faqTitle: "Câu hỏi thường gặp",
    faqItems: [
        {
            id: "1",
            question: "Làm sao để bắt đầu?",
            answer:
                "Đăng ký tài khoản, vào mục Đại lý / Giới thiệu để lấy mã và link — chia sẻ cho bạn bè đăng ký qua link của bạn.",
        },
        {
            id: "2",
            question: "Thu nhập được tính thế nào?",
            answer: "Theo chính sách hoa hồng và doanh thu mạng lưới trên nền tảng — xem tab Quy tắc và bảng điều khiển affiliate.",
        },
        {
            id: "3",
            question: "Làm sao nhận tiền hoa hồng?",
            answer:
                "Theo chu kỳ và ngưỡng rút niêm yết — thường qua ví hoặc kênh thanh toán được hỗ trợ trong tài khoản.",
        },
        {
            id: "4",
            question: "Người chơi hoạt động là gì?",
            answer:
                "Người đăng ký qua link của bạn và có hoạt động nạp/cược theo điều kiện chương trình (chi tiết do vận hành quy định).",
        },
    ],
    enrollment: { ...DEFAULT_REAGENT_ENROLLMENT },
};

const COND_ALLOWED = new Set<string>(REAGENT_CONDITION_TYPES);

function sanitizeEnrollmentCondition(raw: Partial<IReagentEnrollmentCondition>): IReagentEnrollmentCondition | null {
    if (!raw?.id || typeof raw.id !== "string") return null;
    const t = String(raw.type || "");
    const type = (COND_ALLOWED.has(t) ? t : "") as ReagentEnrollmentConditionType;
    if (!type) return null;
    const row: IReagentEnrollmentCondition = {
        id: raw.id.trim().slice(0, 80),
        type,
        enabled: Boolean(raw.enabled),
        value: Math.max(0, Number(raw.value) || 0),
    };
    if (typeof raw.labelVi === "string" && raw.labelVi.trim()) {
        row.labelVi = raw.labelVi.trim().slice(0, 200);
    }
    return row;
}

export function mergeReagentEnrollment(
    partial: Partial<IReagentEnrollment> | null | undefined,
    base: IReagentEnrollment = DEFAULT_REAGENT_ENROLLMENT,
): IReagentEnrollment {
    if (!partial || typeof partial !== "object") {
        return {
            ...base,
            conditions: base.conditions.map((c) => ({ ...c })),
        };
    }
    const mergedConds = Array.isArray(partial.conditions)
        ? (partial.conditions
              .map((c) => sanitizeEnrollmentCondition(c))
              .filter(Boolean) as IReagentEnrollmentCondition[])
        : base.conditions.map((c) => ({ ...c }));
    return {
        gateEnabled: partial.gateEnabled !== undefined ? Boolean(partial.gateEnabled) : base.gateEnabled,
        feeEnabled: partial.feeEnabled !== undefined ? Boolean(partial.feeEnabled) : base.feeEnabled,
        feeAmount:
            partial.feeAmount !== undefined
                ? Math.max(0, Math.min(Number(partial.feeAmount) || 0, 1e12))
                : base.feeAmount,
        feeDescriptionVi:
            typeof partial.feeDescriptionVi === "string"
                ? partial.feeDescriptionVi.trim().slice(0, 500)
                : base.feeDescriptionVi,
        denyMessageVi:
            typeof partial.denyMessageVi === "string"
                ? partial.denyMessageVi.trim().slice(0, 2000)
                : base.denyMessageVi,
        conditions: mergedConds.slice(0, 30),
    };
}

export function mergeReagentPage(
    partial: Partial<IReagentPage> | null | undefined,
    base: IReagentPage = DEFAULT_REAGENT_PAGE,
): IReagentPage {
    if (!partial || typeof partial !== "object") return { ...base, enrollment: mergeReagentEnrollment(null) };
    return {
        ...base,
        ...partial,
        programHeaders: { ...base.programHeaders, ...(partial.programHeaders || {}) },
        stats: Array.isArray(partial.stats) ? partial.stats : base.stats,
        programRows: Array.isArray(partial.programRows) ? partial.programRows : base.programRows,
        faqItems: Array.isArray(partial.faqItems) ? partial.faqItems : base.faqItems,
        enrollment: mergeReagentEnrollment(
            typeof partial.enrollment === "object" && partial.enrollment !== null ? partial.enrollment : undefined,
        ),
    };
}

export const CONDITION_TYPE_VI: Record<ReagentEnrollmentConditionType, string> = {
    min_balance: "Số dư ví chính tối thiểu",
    min_turnover: "Tổng cược (turnover) tối thiểu",
    min_deposit_count: "Số lần nạp tối thiểu",
    kyc_verified: "Đã hoàn thành KYC (value ≥ 1)",
    min_vip_xp: "VIP XP tối thiểu",
};
