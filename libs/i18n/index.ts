import vi from './locales/vi.json';
import en from './locales/en.json';

export const i18n = {
  vi,
  en,
};

export type I18nKey = keyof typeof vi.agency | string;
