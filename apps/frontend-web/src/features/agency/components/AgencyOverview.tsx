/**
 * Agency overview and investment plans section.
 */
import * as React from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import AgencyPlans from './AgencyPlans';

export const AgencyOverview: React.FC = () => {
  const { t } = useLanguage();
  const defaultPlans = [
    {
      _id: '1',
      name: 'Gói Khởi Động VIP',
      profit: '1.2% / ngày',
      min: '1,000,000 đ',
      max: '50,000,000 đ',
      period: '30 ngày',
      type: 'Hàng ngày',
      capitalBack: 'Hoàn gốc',
      referrals: ['Cấp 1: 5%', 'Cấp 2: 2%', 'Cấp 3: 1%'],
    },
    {
      _id: '2',
      name: 'Gói Tăng Trưởng Vàng',
      profit: '1.8% / ngày',
      min: '50,000,000 đ',
      max: '500,000,000 đ',
      period: '60 ngày',
      type: 'Hàng ngày',
      capitalBack: 'Hoàn gốc',
      referrals: ['Cấp 1: 8%', 'Cấp 2: 3%', 'Cấp 3: 2%'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
        <h2 className="text-2xl font-bold text-amber-400 mb-2">
          {t('agency.overview.title', 'Chương Trình Đại Lý & Đầu Tư')}
        </h2>
        <p className="text-white/60 text-sm max-w-xl mx-auto">
          {t('agency.overview.desc', 'Nhận hoa hồng trọn đời và lợi nhuận đầu tư minh bạch hàng ngày.')}
        </p>
      </div>
      <AgencyPlans
        displayPlans={defaultPlans}
        apiPlansLoading={false}
        handlePlanAction={() => {}}
      />
    </div>
  );
};

export default AgencyOverview;
