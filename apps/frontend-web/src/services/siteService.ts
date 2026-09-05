/**
 * Site configuration, store packages, and preference service for frontend-web.
 * Fetches dynamic branding, theme variables, and store catalog items.
 */
import api from './api';
import type { ApiResponse } from '../types';

export interface SiteImages {
  hero?: string;
  logo?: string;
  banner?: string;
  fallback?: string;
}

export interface SitePolicy {
  responsible?: string;
  terms?: string;
  privacy?: string;
  about?: string;
  contact?: string;
}

export interface SiteSite {
  name?: string;
  description?: string;
  telegram?: string;
  supportEmail?: string;
  logo?: string;
  announcement?: string;
  currency?: string;
  transactionLimits?: {
    minDeposit?: number;
    maxDeposit?: number;
    minWithdraw?: number;
    maxWithdraw?: number;
    [key: string]: any;
  };
}

export interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

export const getPageFaqs = async (pageKey?: string): Promise<ApiResponse<FaqItem[]>> => {
  return { success: true, data: [] };
};

export interface SiteFaq {
  aboutUs?: string;
}

export interface SiteDocument {
  terms?: string;
  privacy?: string;
  responsible?: string;
}

export interface SiteData {
  siteName?: string;
  siteDescription?: string;
  uiTheme?: { webMain?: Record<string, string> };
  telegram?: string;
  supportEmail?: string;
  currency?: string;
  site?: SiteSite;
  images?: SiteImages;
  policy?: SitePolicy;
  faq?: SiteFaq;
  document?: SiteDocument;
}

export interface StorePackage {
  _id: string;
  title: string;
  name?: string;
  slug?: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  categoryIds?: string[];
  primaryCategoryId?: string;
  goldCoins: number;
  freeCoins: number;
  soldCount?: number;
  noindex?: boolean;
  benefits?: any;
  status?: 'active' | 'inactive' | string;
  order?: number;
}

export const getSiteData = async (): Promise<ApiResponse<SiteData>> => {
  const res = await api.get<any, ApiResponse<any>>('/setting/site');
  if (!res.success) return res as ApiResponse<SiteData>;
  const raw = res.data as any;
  const data: SiteData = {
    siteName: raw?.siteName ?? raw?.site?.name,
    siteDescription: raw?.siteDescription ?? raw?.site?.description,
    uiTheme: raw?.uiTheme,
    telegram: raw?.telegram ?? raw?.site?.telegram,
    supportEmail: raw?.supportEmail ?? raw?.site?.supportEmail,
    currency: raw?.currency,
    site: raw?.site,
    images: raw?.images,
    policy: raw?.policy,
    faq: raw?.faq,
    document: raw?.document,
  };
  return { ...res, data };
};

export const getSiteSettings = getSiteData;

export const getStorePackages = async (): Promise<ApiResponse<StorePackage[]>> => {
  return await api.get<any, ApiResponse<StorePackage[]>>('/package');
};

export const purchaseStorePackage = async (packageId: string): Promise<ApiResponse<any>> => {
  return await api.post<any, ApiResponse<any>>('/package/purchase', { packageId });
};
