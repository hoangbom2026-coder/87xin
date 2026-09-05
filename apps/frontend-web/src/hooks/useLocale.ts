/**
 * Locale and formatting helper hook.
 */
import { useLanguage } from '../i18n/LanguageContext';

export function useLocale() {
  const { lang, setLang, t } = useLanguage();
  return {
    lang,
    setLang,
    t,
    isVi: lang === 'vi',
    isEn: lang === 'en',
    formatCurrency: (amount: number) => `${amount.toLocaleString('vi-VN')} đ`,
    formatBalance: (amount: number | string = 0) => `${Number(amount || 0).toLocaleString('vi-VN')} đ`,
    formatAmount: (amount: number | string = 0) => Number(amount || 0).toLocaleString('vi-VN'),
  };
}

export default useLocale;
