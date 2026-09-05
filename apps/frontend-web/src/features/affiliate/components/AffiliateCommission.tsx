/**
 * Affiliate commission tiers breakdown component.
 */
import * as React from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { commissionTiers } from '../../../constants/affiliateData';

export const AffiliateCommission: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <h3 className="text-xl font-bold text-amber-400">
        {t('affiliate.commission.title', 'Bảng Mức Hoa Hồng Đại Lý')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {commissionTiers.map((tier, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
            <span className="text-sm font-semibold text-white/70 block mb-1">{tier.level}</span>
            <span className="text-2xl font-bold text-amber-400 block mb-1">{tier.rate}</span>
            <span className="text-xs text-white/40">{tier.minTurnover}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AffiliateCommission;
