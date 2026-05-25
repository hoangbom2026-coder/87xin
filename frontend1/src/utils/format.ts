/**
 * Formats a numeric value as a currency string.
 * Respects locale and currency code from site settings.
 */
export const formatCurrency = (
  amount: number | string = 0,
  currency = 'VND',
  locale = 'vi-VN'
): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return `0 ${currency === 'VND' ? 'đ' : currency}`;

  // Custom handling for VND to ensure the symbol is 'đ' and placed correctly
  if (currency === 'VND') {
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    return formatted.replace('₫', 'đ');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * @deprecated Use useCurrency hook's formatBalance for dynamic currency support.
 * This is kept for backward compatibility during transition.
 */
export const formatBalance = (amount: number | string = 0, currency = 'VND', locale = 'vi-VN'): string => {
  return formatCurrency(amount, currency, locale);
};

export const formatVND = (amount: number | string = 0): string => {
  return formatCurrency(amount, 'VND', 'vi-VN');
};

/**
 * Formats a numeric value with thousands separators (mặc định vi-VN).
 */
export const formatNumber = (value: number | string = 0, locale = 'vi-VN'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat(locale).format(num)
}

/** Ngày giờ ngắn — lịch sử, inbox, bet history */
export function formatDateTime(
  value: string | Date,
  locale = 'vi-VN',
  style: 'date' | 'datetime' | 'time' = 'datetime',
): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  if (style === 'date') {
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  if (style === 'time') {
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

/** Hiển thị số nguyên + hậu tố đ (khi không dùng Intl currency) */
export function formatVndPlain(amount: number | string = 0, locale = 'vi-VN'): string {
  return `${formatNumber(amount, locale)} đ`
}
