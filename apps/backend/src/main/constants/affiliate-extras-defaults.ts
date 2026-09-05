/**
 * Cấu hình mở rộng cho admin Affiliate (cs ngoài affiliateProgram + affiliateOps).
 * Lưu trong settings.affiliateExtras (Mixed). Không động vào logic payout cũ.
 */

export interface IAffiliateMedia {
    /** Banner chính của trang affiliate (URL public). */
    bannerImage: string;
    /** 6 icon minh họa (aff-1.png ... aff-6.png). */
    icons: [string, string, string, string, string, string];
    /** Email hỗ trợ hiển thị trên landing. */
    supportEmail: string;
    /** Link đối tác hoặc nền tảng cốt lõi. */
    partnerLink: string;
}

export interface IAffiliateSlogans {
    earningTitle: string;
    clubTitle: string;
    bannerHeadline: string;
    bannerSubline: string;
}

/** Quy tắc thưởng giới thiệu — admin định nghĩa số tiền + điều kiện. */
export interface IAffiliateSignupReward {
    enabled: boolean;
    amount: number;
    currency: string;
    /** Người được mời phải nạp tối thiểu N (USD/VND tuỳ currency) để kích hoạt. */
    minDeposit: number;
    /** Tổng cược (turnover) tối thiểu để kích hoạt. */
    minWager: number;
    /** Mô tả admin notes. */
    notes: string;
}

/** Bảng VIP rebate: level → wager threshold + rebate %. */
export interface IAffiliateVipRebateTier {
    level: number;
    label: string;
    wagerThreshold: number;
    rebatePercent: number;
}

/** Real-time rewards: feed sôi động — fake hoặc thật. */
export interface IAffiliateFakeFeed {
    enabled: boolean;
    intervalSec: number;
    amountMin: number;
    amountMax: number;
    /** Mẫu username dùng để random (vd: "user***", "vipPlayer***"). */
    fakeUsernames: string[];
    /** Bao nhiêu rows tối đa trong feed. */
    maxRows: number;
}

export type AffiliateCounterMode = 'auto' | 'manual';

export interface IAffiliateCounter {
    /** auto: cộng dồn từ payout thực tế. manual: hiển thị giá trị seed. */
    mode: AffiliateCounterMode;
    manualBaseAmount: number;
    currency: string;
    label: string;
}

export interface IAffiliateExtras {
    media: IAffiliateMedia;
    slogans: IAffiliateSlogans;
    signupReward: IAffiliateSignupReward;
    vipRebate: IAffiliateVipRebateTier[];
    fakeFeed: IAffiliateFakeFeed;
    counter: IAffiliateCounter;
}

export const DEFAULT_AFFILIATE_EXTRAS: IAffiliateExtras = {
    media: {
        bannerImage: '/images/pages/affiliate/banner.png',
        icons: [
            '/images/pages/affiliate/aff-1.png',
            '/images/pages/affiliate/aff-2.png',
            '/images/pages/affiliate/aff-3.png',
            '/images/pages/affiliate/aff-4.png',
            '/images/pages/affiliate/aff-5.png',
            '/images/pages/affiliate/aff-6.png'
        ],
        supportEmail: 'support@tc-gaming.live',
        partnerLink: 'https://tc-gaming.live'
    },
    slogans: {
        earningTitle: 'START EARNING TODAY',
        clubTitle: 'Build Your Own Casino Club',
        bannerHeadline: 'Together We Earn — Together We Win',
        bannerSubline: 'Join our affiliate program — share players, share profit'
    },
    signupReward: {
        enabled: true,
        amount: 100,
        currency: 'USD',
        minDeposit: 50,
        minWager: 200,
        notes: 'Người được mời phải nạp đủ minDeposit và đạt minWager trước khi reward được kích hoạt.'
    },
    vipRebate: [
        { level: 1, label: 'Bronze', wagerThreshold: 1000, rebatePercent: 0.1 },
        { level: 2, label: 'Silver', wagerThreshold: 5000, rebatePercent: 0.25 },
        { level: 3, label: 'Gold', wagerThreshold: 20000, rebatePercent: 0.5 },
        { level: 4, label: 'Platinum', wagerThreshold: 100000, rebatePercent: 0.8 },
        { level: 5, label: 'Diamond', wagerThreshold: 500000, rebatePercent: 1.2 },
        { level: 6, label: 'Elite', wagerThreshold: 2000000, rebatePercent: 1.6 }
    ],
    fakeFeed: {
        enabled: false,
        intervalSec: 300,
        amountMin: 25,
        amountMax: 500,
        fakeUsernames: [
            'lucky_***',
            'pro_player_***',
            'vipclub_***',
            'win_master_***',
            'crystal_***',
            'golden_***'
        ],
        maxRows: 50
    },
    counter: {
        mode: 'manual',
        manualBaseAmount: 684532,
        currency: 'USD',
        label: 'REWARDS SENT OUT TILL DATE'
    }
};

/** Merge sâu, đảm bảo schema không bị thiếu field khi settings cũ thiếu. */
export function mergeAffiliateExtras(raw: unknown): IAffiliateExtras {
    const d = DEFAULT_AFFILIATE_EXTRAS;
    if (!raw || typeof raw !== 'object') return JSON.parse(JSON.stringify(d));
    const r = raw as Partial<IAffiliateExtras>;
    const icons6 = (() => {
        const arr = Array.isArray(r.media?.icons) ? r.media.icons : [];
        const merged = d.media.icons.map((def, i) => String(arr[i] ?? def));
        return merged as IAffiliateMedia['icons'];
    })();
    const media = (r.media ?? {}) as Partial<IAffiliateMedia> & { '9BetLink'?: unknown };

    return {
        media: {
            bannerImage: String(media.bannerImage ?? d.media.bannerImage),
            icons: icons6,
            supportEmail: String(media.supportEmail ?? d.media.supportEmail),
            partnerLink: String(media.partnerLink ?? media['9BetLink'] ?? d.media.partnerLink)
        },
        slogans: {
            earningTitle: String(r.slogans?.earningTitle ?? d.slogans.earningTitle),
            clubTitle: String(r.slogans?.clubTitle ?? d.slogans.clubTitle),
            bannerHeadline: String(r.slogans?.bannerHeadline ?? d.slogans.bannerHeadline),
            bannerSubline: String(r.slogans?.bannerSubline ?? d.slogans.bannerSubline)
        },
        signupReward: {
            enabled: r.signupReward?.enabled ?? d.signupReward.enabled,
            amount: Number(r.signupReward?.amount ?? d.signupReward.amount),
            currency: String(r.signupReward?.currency ?? d.signupReward.currency),
            minDeposit: Number(r.signupReward?.minDeposit ?? d.signupReward.minDeposit),
            minWager: Number(r.signupReward?.minWager ?? d.signupReward.minWager),
            notes: String(r.signupReward?.notes ?? d.signupReward.notes)
        },
        vipRebate: Array.isArray(r.vipRebate) && r.vipRebate.length
            ? r.vipRebate.map((row, i) => ({
                  level: Number(row.level ?? i + 1),
                  label: String(row.label ?? `Tier ${i + 1}`),
                  wagerThreshold: Number(row.wagerThreshold ?? 0),
                  rebatePercent: Number(row.rebatePercent ?? 0)
              }))
            : d.vipRebate.map((x) => ({ ...x })),
        fakeFeed: {
            enabled: r.fakeFeed?.enabled ?? d.fakeFeed.enabled,
            intervalSec: Math.max(10, Number(r.fakeFeed?.intervalSec ?? d.fakeFeed.intervalSec)),
            amountMin: Number(r.fakeFeed?.amountMin ?? d.fakeFeed.amountMin),
            amountMax: Number(r.fakeFeed?.amountMax ?? d.fakeFeed.amountMax),
            fakeUsernames: Array.isArray(r.fakeFeed?.fakeUsernames) && r.fakeFeed.fakeUsernames.length
                ? r.fakeFeed.fakeUsernames.map(String)
                : d.fakeFeed.fakeUsernames.slice(),
            maxRows: Math.max(5, Number(r.fakeFeed?.maxRows ?? d.fakeFeed.maxRows))
        },
        counter: {
            mode: (r.counter?.mode === 'auto' ? 'auto' : 'manual') as AffiliateCounterMode,
            manualBaseAmount: Number(r.counter?.manualBaseAmount ?? d.counter.manualBaseAmount),
            currency: String(r.counter?.currency ?? d.counter.currency),
            label: String(r.counter?.label ?? d.counter.label)
        }
    };
}
