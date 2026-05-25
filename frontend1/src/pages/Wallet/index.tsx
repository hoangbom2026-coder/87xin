import * as React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/ui/PageLayout'
import { useLanguage } from '../../i18n/LanguageContext'
import { sanitizeLocalImagePath } from '../../utils/publicImagePath'

type WalletTab = 'deposit' | 'withdraw'

type DepositMethod = {
  name: string
  icon: string
  desc: string
  to: string
}

const DEPOSIT_METHODS: DepositMethod[] = [
  { name: 'Ngân hàng', icon: '/images/bank/default.svg', desc: 'Chuyển khoản 24/7', to: '/deposit?method=bank' },
  { name: 'Momo', icon: '/images/pages/account/momo.webp', desc: 'Nạp siêu tốc', to: '/deposit?method=ewallet' },
  { name: 'ZaloPay', icon: '/images/pages/account/zalopay.webp', desc: 'Quét mã QR', to: '/deposit?method=tpay' },
  { name: 'ViettelPay', icon: '/images/pages/account/viettelpay.webp', desc: 'Nạp tiền di động', to: '/deposit?method=tpay' },
  { name: 'Thẻ cào', icon: '/images/icons/pages/deposit/phone-card/icon-viettel-selected.webp', desc: 'Phí 15%', to: '/deposit?method=phone_card' },
  { name: 'Crypto (USDT)', icon: '/images/icons/pages/deposit/crypto/icon-TRC20.svg', desc: 'TRC20 / ERC20', to: '/deposit?method=crypto' },
]

const Wallet: React.FC = () => {
  const { t } = useLanguage()
  const [tab, setTab] = useState<WalletTab>('deposit')

  return (
    <PageLayout mainClassName="wallet-page min-h-screen bg-brand-bg pb-24">
      <div className="bg-brand-surface pt-4 px-4 border-b border-gray-800 sticky top-0 z-10">
        <h2 className="text-white font-bold text-lg text-center mb-4">
          {t('wallet.manage', 'Quản lý quỹ')}
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setTab('deposit')}
            className={`flex-1 py-2 text-[13px] font-bold text-center border-b-2 transition-colors ${
              tab === 'deposit' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500'
            }`}
          >
            {t('sidebar.deposit', 'Nạp tiền')}
          </button>
          <button
            type="button"
            onClick={() => setTab('withdraw')}
            className={`flex-1 py-2 text-[13px] font-bold text-center border-b-2 transition-colors ${
              tab === 'withdraw' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500'
            }`}
          >
            {t('sidebar.withdraw', 'Rút tiền')}
          </button>
        </div>
      </div>

      {tab === 'deposit' && (
        <div className="p-4">
          <p className="text-xs text-brand-textMuted uppercase font-bold mb-3 tracking-widest">
            {t('deposit.chooseMethod', 'Chọn phương thức nạp')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DEPOSIT_METHODS.map((method) => (
              <Link
                key={method.to + method.name}
                to={method.to}
                className="bg-brand-surface border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-brand-blue hover:bg-[#1a2235] transition-all active:scale-95"
              >
                <img src={sanitizeLocalImagePath(method.icon)} alt="" className="h-8 w-auto object-contain" aria-hidden />
                <div className="text-center">
                  <p className="text-gray-200 text-xs font-bold">{method.name}</p>
                  <p className="text-gray-500 text-[9px] mt-0.5">{method.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 bg-[#1a202c] border border-brand-blue/30 rounded-lg p-3">
            <h4 className="text-brand-blue text-xs font-bold mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('deposit.importantNote', 'Lưu ý quan trọng')}
            </h4>
            <ul className="text-[10px] text-gray-400 list-disc pl-4 space-y-1">
              <li>{t('deposit.note1', 'Vui lòng kiểm tra kỹ số tài khoản đích trước khi chuyển.')}</li>
              <li>{t('deposit.note2', 'Nội dung chuyển khoản phải điền chính xác mã được cấp.')}</li>
              <li>{t('deposit.note3', 'Hệ thống xử lý tự động trong vòng 1-3 phút.')}</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="p-4 flex flex-col items-center justify-center mt-10">
          <img
            src={sanitizeLocalImagePath('/images/icons/pages/account/icon-menu-bank-active.svg')}
            className="w-16 h-16 opacity-50 mb-3"
            alt=""
            aria-hidden
          />
          <p className="text-gray-400 text-sm font-medium text-center">
            {t('withdrawal.linkBankFirst', 'Bạn cần liên kết thẻ ngân hàng trước khi thực hiện rút tiền.')}
          </p>
          <Link
            to="/account/bank"
            className="mt-4 px-6 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg shadow-lg active:scale-95"
          >
            {t('withdrawal.linkNow', 'Liên kết ngay')}
          </Link>
        </div>
      )}
    </PageLayout>
  )
}

export default Wallet
