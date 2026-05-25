import * as React from 'react'
import { useSelector } from 'react-redux'
import AccountLayout from '../../components/layout/AccountLayout'
import SubHeader from '../../components/common/SubHeader'
import { useLanguage } from '../../i18n/LanguageContext'
import type { RootState } from '../../store'
import AccountAuthPrompt from '../../components/account/AccountAuthPrompt'

/** Trang `/crypto-wallet` — placeholder (API Coin12 chưa gắn); không còn trong menu sidebar. */
const TransactionCoin12: React.FC = () => {
  const { t } = useLanguage()
  const { token } = useSelector((s: RootState) => s.auth)
  const title = t('sidebar.coin12', 'Giao dịch Coin12')
  if (!token) {
    return (
      <AccountLayout title={title} description={t('account.desc.coin12', 'Theo dõi giao dịch Coin12 khi tính năng được kết nối.')}>
        <AccountAuthPrompt />
      </AccountLayout>
    )
  }
  return (
    <AccountLayout
      title={title}
      description={t('account.desc.coin12', 'Theo dõi giao dịch Coin12 khi tính năng được kết nối.')}
      subHeader={<SubHeader title={title} />}
    >
      <div className="rounded-2xl border border-fin-line bg-fin-deep/90 p-6 text-sm leading-relaxed text-text-muted">
        {t('account.coin12Placeholder', 'Tính năng đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ CSKH.')}
      </div>
    </AccountLayout>
  )
}

export default TransactionCoin12
