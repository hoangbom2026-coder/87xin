export interface FooterNavItem {
  id?: string;
  to?: string;
  label: string;
  href?: string;
  external?: boolean;
  i18nKey?: string;
  fallback?: string;
}

export interface FooterNavColumn {
  id?: string;
  title: string;
  titleKey?: string;
  titleFb?: string;
  items?: FooterNavItem[];
  links?: FooterNavItem[];
}

export const FOOTER_TRUST_BADGES: string[] = [
  'l-license-1',
  'l-license-2',
  'provider-1',
  'provider-2',
];
