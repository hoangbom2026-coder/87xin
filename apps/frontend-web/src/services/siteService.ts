/**
 * Site configuration, store packages, and preference service for frontend-web.
 * Fetches dynamic branding, theme variables, and store catalog items.
 */
import api from './api';
import type { ApiResponse } from '../types';

export interface SiteData {
  siteName?: string;
  siteDescription?: string;
  uiTheme?: { webMain?: Record<string, string> };
  telegram?: string;
  supportEmail?: string;
  currency?: string;
}

export interface StorePackage {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
}

export const getSiteData = async (): Promise<ApiResponse<SiteData>> => {
  const res = await api.get<any, ApiResponse<any>>('/preference');
  if (!res.success) return res as ApiResponse<SiteData>;
  const raw = res.data as any;
  const data: SiteData = {
    siteName: raw?.siteName ?? raw?.site?.name,
    siteDescription: raw?.siteDescription ?? raw?.site?.description,
    uiTheme: raw?.uiTheme,
    telegram: raw?.telegram ?? raw?.site?.telegram,
    supportEmail: raw?.supportEmail ?? raw?.site?.supportEmail,
    currency: raw?.currency,
  };
  return { ...res, data };
};

export const getStorePackages = async (): Promise<ApiResponse<StorePackage[]>> => {
  return await api.get<any, ApiResponse<StorePackage[]>>('/package');
};

export const purchaseStorePackage = async (packageId: string): Promise<ApiResponse<any>> => {
  return await api.post<any, ApiResponse<any>>('/package/purchase', { packageId });
};
