/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ADMIN_URL: string
  readonly VITE_SITE_NAME: string
  readonly VITE_LOGO_URL: string
  /** Origin site deploy, ví dụ https://cuocbong99.live */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_SUPPORT_EMAIL?: string
  readonly VITE_PRIVACY_EMAIL?: string
  readonly VITE_TELEGRAM_SUPPORT_URL?: string
  /** URL iframe đá gà (Cockfight), ví dụ https://partner.example/embed */
  readonly VITE_COCKFIGHT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'swiper/css';
declare module 'swiper/css/pagination';
declare module 'swiper/css/effect-fade';
