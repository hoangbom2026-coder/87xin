import { useMemo } from 'react';
import { useSite } from './useSite';
import { formatCurrency } from '../utils/format';

export const useCurrency = () => {
  const { siteData } = useSite();
  const rawSite = (siteData as any)?.site || {};
  const rawCurrency = (siteData as any)?.currency || rawSite?.currency;

  const currencyCode = typeof rawCurrency === 'object' ? rawCurrency?.code || 'VND' : String(rawCurrency || 'VND');
  const currencySymbol = typeof rawCurrency === 'object' ? rawCurrency?.symbol || 'đ' : 'đ';
  const currencyLocale = typeof rawCurrency === 'object' ? rawCurrency?.format || 'vi-VN' : 'vi-VN';

  const formatBalance = useMemo(() => {
    return (amount: number | string = 0) => {
      return formatCurrency(amount, currencyCode, currencyLocale);
    };
  }, [currencyCode, currencyLocale]);

  return {
    currencyCode,
    currencySymbol,
    currencyLocale,
    formatBalance,
  };
};
