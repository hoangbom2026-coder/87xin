/**
 * Banner widget for deposit and financial pages.
 */
import * as React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export const DepositFormBanner: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-white/10 text-center space-y-3">
      <h4 className="text-lg font-bold text-amber-300">
        {t('financial.banner.title', 'Nạp Tiền Nhanh Chóng')}
      </h4>
      <p className="text-xs text-white/60 leading-relaxed">
        {t('financial.banner.desc', 'Hỗ trợ đa dạng phương thức nạp: Ngân hàng 24/7, Ví điện tử, Crypto USDT.')}
      </p>
    </div>
  );
};

export default DepositFormBanner;
