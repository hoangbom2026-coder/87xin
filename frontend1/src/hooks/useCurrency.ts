import { useMemo } from 'react';
import { useSite } from './useSite';
import { formatCurrency } from '../utils/format';

export const useCurrency = () => {
  const { siteData } = useSite();
  
  const currencyCode = siteData?.site?.currency?.code || 'VND';
  const currencySymbol = siteData?.site?.currency?.symbol || 'đ';
  const currencyLocale = siteData?.site?.currency?.format || 'vi-VN';

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
