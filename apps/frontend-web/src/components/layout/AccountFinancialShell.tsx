import * as React from 'react'
import AccountLayout from './AccountLayout'
import FinancialPageTemplate from './FinancialPageTemplate'

export type AccountFinancialActiveTab = 'deposit' | 'withdrawal' | 'transfer' | 'history'

export interface AccountFinancialShellProps {
  /** Tiêu đề sidebar AccountLayout */
  accountTitle: string
  accountDescription?: string
  /** Tab template Nạp/Rút/Chuyển/Lịch sử + FAQ category */
  activeTab: AccountFinancialActiveTab
  /** Tiêu đề trong FinancialPageTemplate (mặc định = accountTitle) */
  financialTitle?: string
  /** Nút SubHeader mobile (sticky, rightContent, …). Không truyền → không render SubHeader. */
  subHeader?: React.ReactNode
  /** Header form bên trái (vd: "Nạp QR Fastpay" + nút Hướng dẫn). */
  formHeader?: React.ReactNode
  /** Ẩn cột banner phải (transfer/history…). */
  hideBanner?: boolean
  children: React.ReactNode
}

const SHELL_PAGE_CLASS: Record<AccountFinancialActiveTab, string> = {
  deposit: 'pages-deposit',
  withdrawal: 'pages-withdraw',
  transfer: 'pages-transfer',
  history: 'pages-history',
}

/**
 * Vỏ chuẩn: AccountLayout → [SubHeader?] → FinancialPageTemplate (embedded).
 * Dùng cho Deposit, Withdrawal, Transfer, History, BetHistory.
 */
const AccountFinancialShell: React.FC<AccountFinancialShellProps> = ({
  accountTitle,
  accountDescription,
  activeTab,
  financialTitle,
  subHeader,
  formHeader,
  hideBanner,
  children,
}) => {
  const ft = financialTitle ?? accountTitle
  return (
    <AccountLayout
      title={accountTitle}
      description={accountDescription}
      subHeader={subHeader}
      shellClassName={SHELL_PAGE_CLASS[activeTab]}
    >
      <FinancialPageTemplate
        title={ft}
        activeTab={activeTab}
        embedded
        formHeader={formHeader}
        hideBanner={hideBanner}
      >
        {children}
      </FinancialPageTemplate>
    </AccountLayout>
  )
}

export default AccountFinancialShell
