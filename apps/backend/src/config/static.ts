/**
 * Static constants and enums for backend domain logic.
 */

export const AG_CURRENCY_OBJ: Record<string, string> = {
    BRL: 'BR_BRL',
    VND: 'VN_VND',
    USD: 'US_USD',
    THB: 'TH_THB',
    CNY: 'CN_CNY'
};

export const TRANSACTION_TYPE = [
    'deposit',
    'withdraw',
    'bonus',
    'game',
    'referral',
    'cashback',
    'system',
    'bet',
    'win',
    'refund'
] as const;

export type TransactionType = typeof TRANSACTION_TYPE[number];

export const TRANSACTION_CATEGORY = [
    'payment',
    'game',
    'promotion',
    'affiliate',
    'vip',
    'system',
    'transfer'
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORY[number];

export const WITHDRAW_STATUS_OPTION = [
    'pending',
    'success',
    'approved',
    'rejected',
    'canceled',
    'failed'
] as const;

export const DEPOSIT_STATUS_OPTION = [
    'pending',
    'success',
    'approved',
    'rejected',
    'canceled',
    'failed'
] as const;

export const AFFILIATE_ROLE = ['affiliate', 'master', 'sub', 'agent'] as const;

export const AFFILIATE_STATUS = ['active', 'inactive', 'pending', 'suspended', 'blocked'] as const;

export const THEME_OPTION = ['light', 'dark', 'system'] as const;
