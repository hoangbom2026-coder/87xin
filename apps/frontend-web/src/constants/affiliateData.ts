/**
 * Affiliate marketing constant structures and localized tiers data.
 */
export const commissionTiers = [
  { level: 'Bạc', minTurnover: '0 - 100M', rate: '25%' },
  { level: 'Vàng', minTurnover: '100M - 500M', rate: '35%' },
  { level: 'Bạch Kim', minTurnover: '500M - 2B', rate: '45%' },
  { level: 'Kim Cương', minTurnover: '> 2B', rate: '55%' },
];

export function getAffiliateSteps(t: (k: string, f?: string) => string) {
  return [
    { step: '1', title: t('affiliate.step1.title', 'Đăng ký đại lý'), desc: t('affiliate.step1.desc', 'Tạo tài khoản đại lý miễn phí') },
    { step: '2', title: t('affiliate.step2.title', 'Chia sẻ liên kết'), desc: t('affiliate.step2.desc', 'Giới thiệu người chơi mới') },
    { step: '3', title: t('affiliate.step3.title', 'Nhận hoa hồng'), desc: t('affiliate.step3.desc', 'Hưởng lợi nhuận trọn đời') },
  ];
}

export function getAffiliateBenefits(t: (k: string, f?: string) => string) {
  return [
    { title: t('affiliate.benefit1.title', 'Hoa hồng lên tới 55%'), desc: t('affiliate.benefit1.desc', 'Tỷ lệ chia sẻ cao nhất thị trường') },
    { title: t('affiliate.benefit2.title', 'Thanh toán nhanh chóng'), desc: t('affiliate.benefit2.desc', 'Quyết toán định kỳ minh bạch') },
  ];
}

export function getRecentCommissions(t: (k: string, f?: string) => string) {
  return [
    { user: 'user***9', amount: '15,400,000 đ', time: 'Vừa xong' },
    { user: 'agent***1', amount: '48,200,000 đ', time: '5 phút trước' },
  ];
}
