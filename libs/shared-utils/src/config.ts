/**
 * Centralized system constants and URL configurations for TC-Gaming Monorepo.
 */

export const SYSTEM_CONFIG = {
  DOMAIN: 'tc-gaming.live',
  ADMIN_DOMAIN: 'admin.tc-gaming.live',
  API_DOMAIN: 'api.tc-gaming.live',
  
  SITE_NAME: 'TC Gaming',
  SUPPORT_EMAIL: 'support@tc-gaming.live',
  PRIVACY_EMAIL: 'privacy@tc-gaming.live',
  TELEGRAM_SUPPORT_URL: 'https://t.me/tcgaming_support',
  
  DEFAULT_BACKEND_PORT: 8701,
  DEFAULT_ADMIN_PORT: 8781,
  
  DEFAULT_API_URL: '/api',
  DEFAULT_PUBLIC_URL: 'https://tc-gaming.live',
  DEFAULT_MONGODB_URL: 'mongodb://127.0.0.1:27017/tc-gaming',
} as const;

export function getPublicSiteUrl(envUrl?: string): string {
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/+$/, '');
  return SYSTEM_CONFIG.DEFAULT_PUBLIC_URL;
}

export function getApiBaseUrl(envUrl?: string): string {
  if (envUrl && envUrl.trim()) return envUrl;
  return SYSTEM_CONFIG.DEFAULT_API_URL;
}

export function getSupportEmail(envEmail?: string): string {
  if (envEmail && envEmail.trim()) return envEmail;
  return SYSTEM_CONFIG.SUPPORT_EMAIL;
}

export function getTelegramSupportUrl(envTg?: string): string {
  if (envTg && envTg.trim()) return envTg;
  return SYSTEM_CONFIG.TELEGRAM_SUPPORT_URL;
}
