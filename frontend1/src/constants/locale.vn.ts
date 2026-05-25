/**
 * Chuẩn thị trường Việt Nam — một nguồn cho locale, tiền tệ, giới hạn giao dịch, regex.
 * Admin có thể ghi đè qua `siteData.site.currency` / `transactionLimits` (useSite).
 */
export const VN_LOCALE = 'vi-VN' as const
export const VN_CURRENCY_CODE = 'VND' as const
export const VN_CURRENCY_SYMBOL = 'đ' as const

/** Mệnh giá thẻ cào / quick amount (VND) — đồng bộ `constants/financial.ts` */
export const VN_CARD_DENOMINATIONS_VND = [
  10_000, 20_000, 30_000, 50_000, 100_000, 200_000, 300_000, 500_000, 1_000_000,
] as const

/** Giới hạn mặc định khi API/site chưa cấu hình */
export const VN_TRANSACTION_LIMITS_DEFAULT = {
  minDepositVnd: 10_000,
  minWithdrawVnd: 50_000,
  maxDepositVnd: 500_000_000,
  maxWithdrawVnd: 300_000_000,
} as const

/** SĐT VN: 0xxxxxxxxx hoặc +84… (10–11 chữ số sau chuẩn hóa) */
export const VN_PHONE_REGEX = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/

/** STK ngân hàng VN thường 6–19 chữ số */
export const VN_BANK_ACCOUNT_REGEX = /^\d{6,19}$/

export type VnLocaleDefaults = {
  locale: typeof VN_LOCALE
  currencyCode: typeof VN_CURRENCY_CODE
  currencySymbol: typeof VN_CURRENCY_SYMBOL
}

export const VN_DEFAULTS: VnLocaleDefaults = {
  locale: VN_LOCALE,
  currencyCode: VN_CURRENCY_CODE,
  currencySymbol: VN_CURRENCY_SYMBOL,
}
