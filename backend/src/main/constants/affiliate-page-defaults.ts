/** Nội dung khu vực affiliate web — banner theo tab, quy tắc HTML, intro tab mã… */

export type AffiliateWebTabKey = 'dashboard' | 'rewards' | 'codes' | 'rules' | 'banners';

export interface AffiliateTabContentConfig {
    heroTitle?: string;
    heroSubtitle?: string;
    heroBackground?: string;
    promoTitle?: string;
    promoHighlight?: string;
    promoBody?: string;
    promoImage?: string;
    hidePromo?: boolean;
}

export type AffiliateTabContentMap = Partial<Record<AffiliateWebTabKey, AffiliateTabContentConfig>>;

export const AFFILIATE_TAB_KEYS: AffiliateWebTabKey[] = [
    'dashboard',
    'rewards',
    'codes',
    'rules',
    'banners'
];

export interface IAffiliatePage {
    pageBannerTitle: string;
    pageBannerSubtitle: string;
    dashboardBannerTitle: string;
    dashboardBannerHighlight: string;
    dashboardBannerBody: string;
    dashboardBannerImage: string;
    rulesHtml: string;
    referralIntroTitle: string;
    referralIntroBody: string;
    tabContent?: AffiliateTabContentMap;
    faqItems?: Array<{ id?: string; question: string; answer: string }>;
}

export const DEFAULT_AFFILIATE_PAGE: IAffiliatePage = {
    pageBannerTitle: '',
    pageBannerSubtitle: '',
    dashboardBannerTitle: 'Tìm hiểu thêm về',
    dashboardBannerHighlight: 'chương trình liên kết',
    dashboardBannerBody:
        'Giới thiệu người chơi qua mã của bạn — theo dõi hoa hồng và mạng lưới trong tab Đại lý. Chính sách cụ thể xem mục Quy tắc.',
    dashboardBannerImage: '/images/game/search/lobby-game.webp',
    rulesHtml:
        '<p>Chương trình giới thiệu và hoa hồng áp dụng theo điều khoản nền tảng. Tỷ lệ và điều kiện có thể thay đổi; phiên bản hiển thị tại đây do vận hành cập nhật.</p>',
    referralIntroTitle: 'Giới thiệu bạn bè',
    referralIntroBody:
        'Tạo mã riêng, chia sẻ link có tham số <strong>r</strong>. Người nhận mở link và đăng ký — hệ thống gắn mã với tài khoản của bạn.',
    faqItems: []
};

function builtinTabsFromLegacy(b: IAffiliatePage): AffiliateTabContentMap {
    return {
        dashboard: {
            promoTitle: b.dashboardBannerTitle,
            promoHighlight: b.dashboardBannerHighlight,
            promoBody: b.dashboardBannerBody,
            promoImage: b.dashboardBannerImage
        },
        rewards: {
            promoTitle: 'Tối ưu thu nhập',
            promoHighlight: 'quy đổi & theo dõi hoa hồng',
            promoBody:
                'Kiểm tra hoa hồng và thưởng giới thiệu khả dụng. Dùng quy đổi chủ động hoặc chờ chi trả tự động khi admin bật auto‑payout và đạt ngưỡng.',
            promoImage: '/images/game/search/lobby-game.webp'
        },
        codes: {
            promoTitle: 'Mã của bạn',
            promoHighlight: 'lan toả & được ghi nhận',
            promoBody:
                'Tạo nhiều mã và chia sẻ link chứa tham số r — báo cáo theo từng mã được cập nhật từ dữ liệu thực.',
            promoImage: '/images/game/search/lobby-game.webp'
        },
        rules: {
            promoTitle: 'Quy tắc áp dụng',
            promoHighlight: 'F‑Infinity & minh bạch',
            promoBody:
                'Chi tiết chính sách do admin cập nhật trong HTML phía dưới; bảng bậc hoa hồng phản ánh tiers đang cấu hình trên máy chủ.',
            promoImage: '/images/game/search/lobby-game.webp'
        },
        banners: {
            promoTitle: 'Thương hiệu thống nhất',
            promoHighlight: 'tài nguyên chính chủ',
            promoBody:
                'Tải banner và embed HTML đồng bộ với bộ nhận diện nền tảng — nội dung do đội vận hành đăng qua CMS.',
            promoImage: '/images/game/search/lobby-game.webp'
        }
    };
}

export function mergeTabContentDeep(
    base: AffiliateTabContentMap,
    overlay?: AffiliateTabContentMap | null
): AffiliateTabContentMap {
    const o = overlay && typeof overlay === 'object' ? overlay : {};
    const out: AffiliateTabContentMap = {};
    for (const k of AFFILIATE_TAB_KEYS) {
        out[k] = { ...(base[k] || {}), ...(o[k] || {}) };
    }
    return out;
}

export function mergeAffiliatePage(
    partial: Partial<IAffiliatePage> | null | undefined,
    base: IAffiliatePage = DEFAULT_AFFILIATE_PAGE
): IAffiliatePage & { tabContent: AffiliateTabContentMap } {
    if (!partial || typeof partial !== 'object') {
        const tabContent = mergeTabContentDeep(builtinTabsFromLegacy(base));
        return { ...base, tabContent };
    }

    const flat: IAffiliatePage = {
        ...base,
        ...partial,
        pageBannerTitle:
            partial.pageBannerTitle !== undefined ? String(partial.pageBannerTitle) : base.pageBannerTitle,
        pageBannerSubtitle:
            partial.pageBannerSubtitle !== undefined
                ? String(partial.pageBannerSubtitle)
                : base.pageBannerSubtitle,
        dashboardBannerTitle:
            partial.dashboardBannerTitle !== undefined
                ? String(partial.dashboardBannerTitle)
                : base.dashboardBannerTitle,
        dashboardBannerHighlight:
            partial.dashboardBannerHighlight !== undefined
                ? String(partial.dashboardBannerHighlight)
                : base.dashboardBannerHighlight,
        dashboardBannerBody:
            partial.dashboardBannerBody !== undefined
                ? String(partial.dashboardBannerBody)
                : base.dashboardBannerBody,
        dashboardBannerImage:
            partial.dashboardBannerImage !== undefined
                ? String(partial.dashboardBannerImage)
                : base.dashboardBannerImage,
        rulesHtml:
            partial.rulesHtml !== undefined && partial.rulesHtml !== null
                ? String(partial.rulesHtml)
                : base.rulesHtml,
        referralIntroTitle:
            partial.referralIntroTitle !== undefined
                ? String(partial.referralIntroTitle)
                : base.referralIntroTitle,
        referralIntroBody:
            partial.referralIntroBody !== undefined
                ? String(partial.referralIntroBody)
                : base.referralIntroBody,
        faqItems: Array.isArray(partial.faqItems) ? partial.faqItems : base.faqItems
    };

    const tabContent = mergeTabContentDeep(builtinTabsFromLegacy(flat), partial.tabContent ?? null);

    return { ...flat, tabContent };
}
