/** 5 nhóm khuyến mãi cố định (đồng bộ với HTML mẫu landing). */
export const PROMOTION_CATEGORIES = [
    { key: 'new_member', label: 'Thành viên mới', color: '#22c55e' },
    { key: 'live_casino', label: 'Live Casino', color: '#a855f7' },
    { key: 'slot', label: 'Slots', color: '#f59e0b' },
    { key: 'sport', label: 'Thể thao', color: '#3b82f6' },
    { key: 'bonus', label: 'Bonus chung', color: '#ef4444' },
    { key: 'general', label: 'Khác', color: '#6b7280' }
] as const;

export type PromotionCategoryKey = (typeof PROMOTION_CATEGORIES)[number]['key'];

export const PROMOTION_CATEGORY_KEYS = PROMOTION_CATEGORIES.map((c) => c.key) as PromotionCategoryKey[];
