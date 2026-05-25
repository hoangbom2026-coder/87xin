/**
 * Cấu hình vận hành marketing (feature flag + slot tích hợp công khai).
 * Secret thanh toán / casino vẫn nằm env — chỉ lưu ID công khai, URL webhook, ghi chú.
 */

export interface IMarketingIntegrationSlot {
    id: string;
    label: string;
    enabled: boolean;
    /** Measurement ID / Pixel ID / token công khai (không dùng cho ký API nhạy cảm). */
    referenceKey?: string;
    endpointUrl?: string;
    notes?: string;
}

export interface IMarketingOps {
    featureFlags: {
        promotionsCmsEnabled: boolean;
        depositBonusHighlight: boolean;
        notifyOnPromoMaintenance: boolean;
    };
    integrationSlots: IMarketingIntegrationSlot[];
}

const DEFAULT_SLOTS: IMarketingIntegrationSlot[] = [
    {
        id: 'ga4',
        label: 'Google Analytics — Measurement ID (G-xxxx)',
        enabled: false
    },
    { id: 'fb_pixel', label: 'Facebook / Meta Pixel ID', enabled: false },
    { id: 'telegram_public', label: 'Telegram (link @username hoặc public)', enabled: false },
    {
        id: 'webhook_callback',
        label: 'Webhook URL công khai (callback marketing)',
        enabled: false
    },
    {
        id: 'external_api_base',
        label: 'Base URL API marketing ngoài (không chứa secret)',
        enabled: false
    }
];

export const DEFAULT_MARKETING_OPS: IMarketingOps = {
    featureFlags: {
        promotionsCmsEnabled: true,
        depositBonusHighlight: true,
        notifyOnPromoMaintenance: false
    },
    integrationSlots: DEFAULT_SLOTS.map((s) => ({ ...s }))
};

function mergeSlots(
    defaults: IMarketingIntegrationSlot[],
    stored?: Partial<IMarketingIntegrationSlot>[] | null
): IMarketingIntegrationSlot[] {
    const map = new Map(defaults.map((d) => [d.id, { ...d }]));
    if (!stored?.length) return Array.from(map.values());
    for (const s of stored) {
        if (!s?.id || !map.has(String(s.id))) continue;
        const b = map.get(String(s.id))!;
        map.set(String(s.id), {
            ...b,
            ...s,
            id: String(s.id),
            label:
                typeof s.label === 'string' && s.label.trim().length > 0
                    ? s.label.trim()
                    : b.label,
            enabled: s.enabled !== undefined ? Boolean(s.enabled) : b.enabled,
            referenceKey:
                s.referenceKey !== undefined ? String(s.referenceKey) : b.referenceKey,
            endpointUrl: s.endpointUrl !== undefined ? String(s.endpointUrl) : b.endpointUrl,
            notes: s.notes !== undefined ? String(s.notes) : b.notes
        });
    }
    return defaults.map((d) => map.get(d.id)!).filter(Boolean);
}

/** Đưa blob Mongo → cấu hình đầy đủ (luôn đủ slot mặc định). */
export function normalizeMarketingOps(stored?: Partial<IMarketingOps> | null): IMarketingOps {
    const s = stored && typeof stored === 'object' ? stored : {};
    const ffIn = (s.featureFlags || {}) as Partial<IMarketingOps['featureFlags']>;
    const d = DEFAULT_MARKETING_OPS.featureFlags;
    return {
        featureFlags: {
            promotionsCmsEnabled:
                ffIn.promotionsCmsEnabled !== undefined
                    ? Boolean(ffIn.promotionsCmsEnabled)
                    : d.promotionsCmsEnabled,
            depositBonusHighlight:
                ffIn.depositBonusHighlight !== undefined
                    ? Boolean(ffIn.depositBonusHighlight)
                    : d.depositBonusHighlight,
            notifyOnPromoMaintenance:
                ffIn.notifyOnPromoMaintenance !== undefined
                    ? Boolean(ffIn.notifyOnPromoMaintenance)
                    : d.notifyOnPromoMaintenance
        },
        integrationSlots: mergeSlots(
            DEFAULT_MARKETING_OPS.integrationSlots,
            Array.isArray(s.integrationSlots) ? s.integrationSlots : []
        )
    };
}
