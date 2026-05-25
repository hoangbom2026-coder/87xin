import { type PromoFilterDef, type PromoFilterKey } from '../types'

/**
 * Tab lọc khuyến mãi — cố định, không trùng nhãn.
 * Thứ tự: Tất cả → VIP trở lại → Tân thủ → Nạp tiền → Casino → Slot/Bắn cá → Thể thao.
 * (HOT / USDT / Tri ân không còn tab riêng — KM đó vẫn hiện khi chọn «Tất cả».)
 */
export const PROMO_FILTER_KEYS = [
  'all',
  'vip_return',
  'newbie',
  'deposit',
  'casino',
  'slot_fishing',
  'sports',
] as const

const I18N_BY_KEY: Record<PromoFilterKey, string> = {
  all: 'promotions.filter.all',
  vip_return: 'promotions.filter.vipReturn',
  newbie: 'promotions.filter.newbie',
  deposit: 'promotions.filter.deposit',
  casino: 'promotions.filter.casino',
  slot_fishing: 'promotions.filter.slotFishing',
  sports: 'promotions.filter.sports',
}

/** Nhãn tiếng Việt mặc định (fallback khi chưa có trong LanguageContext). */
const FALLBACK_VI: Record<PromoFilterKey, string> = {
  all: 'TẤT CẢ',
  vip_return: 'VIP TRỞ LẠI',
  newbie: 'TÂN THỦ',
  deposit: 'NẠP TIỀN',
  casino: 'CASINO',
  slot_fishing: 'SLOT/BẮN CÁ',
  sports: 'THỂ THAO',
}

export function defaultPromoFilters(t: (key: string, fallback?: string) => string): PromoFilterDef[] {
  return PROMO_FILTER_KEYS.map((key) => ({
    value: key,
    label: t(I18N_BY_KEY[key], FALLBACK_VI[key]),
  }))
}
