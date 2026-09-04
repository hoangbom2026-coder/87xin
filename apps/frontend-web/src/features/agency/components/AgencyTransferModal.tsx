import * as React from 'react'
import { TrendingUp, RefreshCcw } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { useLanguage } from '../../../i18n/LanguageContext'

interface AgencyTransferModalProps {
  open: boolean
  onClose: () => void
  user: any
  reagentStatus: any
  selectedPlan: any
  transferAmount: string
  setTransferAmount: (val: string) => void
  isTransferring: boolean
  handleTransferSubmit: () => void
  formatBalance: (amount?: number | string) => string
}

const AgencyTransferModal: React.FC<AgencyTransferModalProps> = ({
  open,
  onClose,
  user,
  selectedPlan,
  transferAmount,
  setTransferAmount,
  isTransferring,
  handleTransferSubmit,
  formatBalance,
}) => {
  const { t } = useLanguage()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      showClose
    >
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-white font-black text-xl uppercase italic tracking-tight">
              {t('agency.investModalTitle', 'Đầu tư gói')}
            </h3>
            <p className="text-text-muted text-[10px] font-medium uppercase tracking-widest">
              {selectedPlan?.name
                ? `${selectedPlan.name} · ${t('agency.investmentAmount', 'Số tiền đầu tư')}`
                : t('agency.investmentAmount', 'Số tiền đầu tư')}
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-fin-line rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-text-gray text-[10px] font-black uppercase tracking-widest mb-2">
                {t('common.accountBalance', 'Số dư tài khoản')}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-primary text-3xl font-black">{formatBalance(user?.balance || 0)}</span>
                <button className="text-primary hover:rotate-180 transition-transform duration-500">
                  <RefreshCcw size={16} />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-text-gray text-[10px] font-black uppercase tracking-widest mb-1">
                {t('agency.settlementCycle', 'Chu kỳ giải quyết')}
              </p>
              <p className="text-white font-bold text-xs">1 {t('common.hour', 'giờ')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-text-gray text-[10px] font-black uppercase tracking-widest">
              {t('agency.investmentAmount', 'Số tiền đầu tư')}
            </label>
            <span className="text-text-muted text-[10px] font-medium">{new Date().toLocaleString()}</span>
          </div>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-lg">đ</div>
            <input
              type="text"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('agency.minTransferHint', 'Ít nhất đ100, chỉ số nguyên')}
              className="w-full bg-black/40 border border-fin-line rounded-2xl py-4 pl-12 pr-20 text-white font-black placeholder:text-white/20 focus:border-primary/50 transition-all outline-none"
            />
            <button
              onClick={() => setTransferAmount(String(user?.balance || 0))}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-primary font-black text-[10px] uppercase italic hover:text-white transition-colors"
            >
              {t('common.all', 'Tất Cả')}
            </button>
          </div>
        </div>

        <Button
          onClick={handleTransferSubmit}
          disabled={!transferAmount}
          isLoading={isTransferring}
          size="xl"
          className="w-full font-black uppercase tracking-[0.2em] italic shadow-lg shadow-primary/20"
        >
          {t('agency.confirmInvest', 'Xác nhận đầu tư')}
        </Button>

        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-primary text-[10px] font-bold text-center leading-relaxed italic">
            {t('agency.investHint', 'Tiền trừ từ số dư ví chính. Lãi kỳ theo cấu hình gói và hệ thống.')}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default AgencyTransferModal
