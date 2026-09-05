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
  };
}

export default useLocale;
