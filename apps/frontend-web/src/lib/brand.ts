import type { SiteData } from '../services/siteService'
import { DEFAULT_SITE_NAME } from '../constants/brandDefaults'

export const getBrandName = (siteData: SiteData | null | undefined): string => {
  const value = siteData?.siteName ?? siteData?.site?.name ?? DEFAULT_SITE_NAME
  return value.trim() || DEFAULT_SITE_NAME
}

export const applyBrand = (text: string, brand: string): string =>
  text.replace(/\{\{brand\}\}/g, brand)
