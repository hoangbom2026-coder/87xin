import { type DepositCryptoNetwork, type FinancialFaq } from '../types'

export const CRYPTO_NETWORKS = [
  { id: 'usdt_trc20', name: 'USDT - TRC20', rate: '26,511', icon: '/images/icons/pages/account/icon-usdt.webp' },
  { id: 'usdt_bep20', name: 'USDT - BEP20', rate: '26,511', icon: '/images/icons/pages/account/icon-usdt.webp' },
  { id: 'eth_erc20', name: 'ETH - ERC20', rate: '61,034,486', icon: '/images/icons/pages/account/icon-eth.webp' },
  { id: 'bnb_bep20', name: 'BNB - BEP20', rate: '17,090,020', icon: '/images/icons/pages/account/icon-bnb.webp' },
];

/** Trang nạp crypto: card chọn mạng (icon SVG từ `/images/icons/pages/deposit/crypto/`). */
export const DEPOSIT_CRYPTO_NETWORKS: DepositCryptoNetwork[] = [
  {
    id: 'TRC20',
    name: 'USDT (TRC20)',
    rateLine: '1 USDT = 26,385 VNĐ',
    icon: '/images/icons/pages/deposit/crypto/icon-TRC20.svg',
  },
  {
    id: 'ERC20',
    name: 'ETH (ERC20)',
    rateLine: '',
    icon: '/images/icons/pages/deposit/crypto/icon-etherc20-disable.svg',
    disabled: true,
    comingSoon: true,
  },
  {
    id: 'BEP20',
    name: 'BNB (BEP20)',
    rateLine: '',
    icon: '/images/icons/pages/deposit/crypto/icon-bnbbep20-disable.svg',
    disabled: true,
    comingSoon: true,
  },
]

export const DEPOSIT_CRYPTO_PACKAGES = [
  { id: '1', title: 'Hoàn trả 1.2%', description: 'Không giới hạn' },
] as const

export const DEPOSIT_CRYPTO_PROMO = [
  { key: 'quick', img: '/images/pages/account/bonus/crypto-promote/quick.webp', labelKey: 'deposit.cryptoPromoQuick' },
  { key: 'save', img: '/images/pages/account/bonus/crypto-promote/save.webp', labelKey: 'deposit.cryptoPromoSave' },
  { key: 'secure', img: '/images/pages/account/bonus/crypto-promote/secure.webp', labelKey: 'deposit.cryptoPromoSecure' },
] as const;

export const EWALLETS = [
  { id: 'momo', name: 'Momo', icon: '/images/pages/account/momo.webp', status: 'maintenance' },
  { id: 'viettelpay', name: 'Viettel Money', icon: '/images/pages/account/viettelpay.webp', status: 'maintenance' },
  { id: 'zalopay', name: 'Zalopay', icon: '/images/pages/account/zalopay.webp', status: 'maintenance' },
];

export const CARD_PROVIDERS = [
  { id: 'viettel', name: 'Viettel', icon: '/images/pages/account/card/viettel.webp' },
  { id: 'mobifone', name: 'Mobifone', icon: '/images/pages/account/card/mobifone.webp' },
  { id: 'vinaphone', name: 'Vinaphone', icon: '/images/pages/account/card/vinaphone.webp' },
  { id: 'zing', name: 'Zing', icon: '/images/pages/account/card/zing.webp' },
];

export const DENOMINATIONS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000];

export const FINANCIAL_FAQS: FinancialFaq[] = [
  { key: 'deposit_how',    qKey: 'faq.financial.deposit_how.q',    aKey: 'faq.financial.deposit_how.a' },
  { key: 'deposit_time',   qKey: 'faq.financial.deposit_time.q',   aKey: 'faq.financial.deposit_time.a' },
  { key: 'withdraw_how',   qKey: 'faq.financial.withdraw_how.q',   aKey: 'faq.financial.withdraw_how.a' },
  { key: 'withdraw_limit', qKey: 'faq.financial.withdraw_limit.q', aKey: 'faq.financial.withdraw_limit.a' },
  { key: 'transfer_how',   qKey: 'faq.financial.transfer_how.q',   aKey: 'faq.financial.transfer_how.a' },
];
