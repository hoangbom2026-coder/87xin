import * as React from 'react'
import { Link } from 'react-router-dom'
import { Wallet, MessagesSquare, HelpCircle, ChevronRight, History } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useCurrency } from '../../hooks/useCurrency'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import PageLayout from '../ui/PageLayout'
import { FINANCIAL_FAQS } from '../../constants/financial'
import { FIN } from '../../constants/financialUi'
import { ACCOUNT_VIEW_FADE_CLASS } from '../../constants/pageShell'
import DepositFormBanner from '../financial/DepositFormBanner'
import { cn } from '../../lib/cn'

interface FinancialPageTemplateProps {
  title: string
  activeTab: 'deposit' | 'withdrawal' | 'transfer' | 'history'
  children: React.ReactNode
  /** Bọc trong layout tài khoản (đã có PageLayout): bỏ lặp và thanh Nạp/Rút/Chuyển */
  embedded?: boolean
  /** Header form bên trái (vd: "Nạp QR Fastpay" + nút Hướng dẫn). Chỉ embedded. */
  formHeader?: React.ReactNode
  /** Ẩn cột banner phải (vd: trang transfer/history không cần) */
  hideBanner?: boolean
}

const FinancialPageTemplate: React.FC<FinancialPageTemplateProps> = ({
  title,
  activeTab,
  children,
  embedded,
  formHeader,
  hideBanner,
}) => {
  const { t } = useLanguage()
  const { user } = useSelector((state: RootState) => state.auth)
  const { formatBalance } = useCurrency()
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

  if (embedded) {
    const depositFlat = activeTab === 'deposit'
    return (
      <div
        className={cn(
          'account-financial-embedded w-full min-w-0',
          ACCOUNT_VIEW_FADE_CLASS,
          depositFlat
            ? 'pages-deposit-embedded pages-account__has-method-tabs'
            : cn(FIN.panel, 'pages-account__has-method-tabs p-4 sm:p-5 md:p-6'),
        )}
      >
        <div
          className={cn(
            'pages-deposit__grid grid min-w-0 gap-[var(--section-gap-mobile)] lg:gap-[var(--section-gap)]',
            !hideBanner && 'lg:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] xl:grid-cols-[minmax(0,1fr)_minmax(220px,260px)]',
          )}
        >
          <div className="pages-deposit__main deposit-form min-w-0">
            {formHeader}
            {children}
          </div>

          {!hideBanner ? <DepositFormBanner /> : null}
        </div>
      </div>
    )
  }

  const inner = (
    <div className={embedded ? '' : cn('afterlogin_wrap', ACCOUNT_VIEW_FADE_CLASS)}>
      {!embedded ? (
        <h3 className="text-white font-black uppercase italic tracking-tighter mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 shrink-0 rounded-full bg-primary/80" />
            {title}
          </div>
          <Link
            to="/account/transaction-history"
            className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-colors ${activeTab === 'history' ? 'text-primary' : 'text-text-gray hover:text-primary'}`}
          >
            <History size={16} />
            {t('sidebar.history', 'History')}
          </Link>
        </h3>
      ) : null}

      <div className="afterlogin_inn_wrap grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="afterlogin_inn_wrap_left">
          {!embedded ? (
            <div className="depwith_wrapbtn mb-8">
              <Link
                to="/deposit"
                className={`depwith_wrapbtn_left transition-all hover:bg-white/10 ${activeTab === 'deposit' ? 'active' : ''}`}
              >
                {t('sidebar.deposit', 'Deposit')}
              </Link>
              <Link
                to="/transfer"
                className={`depwith_wrapbtn_mid transition-all hover:bg-white/10 ${activeTab === 'transfer' ? 'active' : ''}`}
              >
                {t('sidebar.transfer', 'Transfer')}
              </Link>
              <Link
                to="/withdraw"
                className={`depwith_wrapbtn_right transition-all hover:bg-white/10 ${activeTab === 'withdrawal' ? 'active' : ''}`}
              >
                {t('sidebar.withdraw', 'Withdraw')}
              </Link>
            </div>
          ) : null}

          <div className={`afterlogin_dep_headbody_wrap ${FIN.panel} overflow-hidden shadow-2xl border border-fin-line rounded-2xl`}>
            <div className={`afterlogin_dep_head py-6 px-8 ${FIN.panelHead}`}>
              <div className="head_col_1 flex items-center justify-between mb-4">
                <span className="text-text-gray font-black uppercase text-[10px] tracking-widest">
                  {t('account.balance', 'Balance')}
                </span>
              </div>
              <div className="head_col_2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                    <Wallet size={22} aria-hidden strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-black text-3xl tracking-tighter italic">
                      {formatBalance(user?.balance ?? 0)}
                    </span>
                    <span className="text-primary font-black text-[9px] uppercase tracking-widest">
                      {t('common.mainWallet', 'Main Wallet')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="afterlogin_dep_body py-6 px-8">{children}</div>
          </div>
        </div>

        <div className="afterlogin_inn_wrap_right space-y-6">
          <div className={`afterlogin_inn_wrap_faqbody ${FIN.panel} py-6 px-8 h-full relative group overflow-hidden border border-fin-line rounded-2xl`}>
            <div className="pointer-events-none absolute top-0 right-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-primary/[0.04] blur-2xl" aria-hidden />

            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8 flex items-center gap-3 italic">
              <HelpCircle size={18} className="text-primary" />
              {t('history.faq', 'Financial FAQ')}
            </h4>

            <div className="space-y-4 relative z-10">
              {FINANCIAL_FAQS.map((faq, i) => (
                <div key={i} className={`card ${FIN.inset} overflow-hidden border border-fin-line`}>
                  <div
                    className="card-header p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-white font-bold text-xs leading-tight pr-4">{t(faq.qKey)}</span>
                    <ChevronRight
                      size={14}
                      className={`text-text-gray transition-transform duration-150 ${openFaq === i ? 'rotate-90' : ''}`}
                    />
                  </div>
                  {openFaq === i && (
                    <div className="card-body p-6 text-text-muted text-xs font-medium leading-relaxed fin-divider pt-4 whitespace-pre-line">
                      {t(faq.aKey)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 fin-divider">
              <div className="flex items-center gap-4 bg-primary/10 p-5 rounded-2xl border border-primary/20">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black">
                  <MessagesSquare size={20} aria-hidden strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-[10px] uppercase tracking-widest">
                    {t('responsible.help.title', 'Need help?')}
                  </span>
                  <Link to="/contact" className="text-primary font-black text-xs uppercase hover:underline">
                    {t('responsible.help.contact', 'Contact Support')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return <PageLayout>{inner}</PageLayout>
}

export default FinancialPageTemplate
