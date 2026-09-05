import * as React from 'react'
import { useState } from 'react'
import { Coins } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useSite } from '../../../hooks/useSite'
import FinancialNotice from '../../../components/financial/FinancialNotice'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { CARD_PROVIDERS } from '../../../constants/financial'
import { cn } from '../../../lib/cn'
import { ACCOUNT_VIEW_FADE_CLASS } from '../../../constants/pageShell'
import { createWithdrawRequest } from '../../../services/withdrawService'
import { toast } from '../../../utils/toast'

/**
 * WithdrawCard — panel rút qua thẻ cào.
 */
const WithdrawCard: React.FC = () => {
  const { t } = useLanguage()
  const { siteData } = useSite()
  const [selected, setSelected] = useState<string>(CARD_PROVIDERS[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const minWithdrawVnd = siteData?.site?.transactionLimits?.minWithdrawVnd || 200000;
  const maxWithdrawVnd = siteData?.site?.transactionLimits?.maxWithdrawVnd || 300000000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(String(amount).replace(/\s/g, ''))
    if (!Number.isFinite(value) || value < minWithdrawVnd || value > maxWithdrawVnd) {
      toast.error(t('common.invalidAmount', `Số tiền phải từ ${minWithdrawVnd.toLocaleString('vi-VN')} đ đến ${maxWithdrawVnd.toLocaleString('vi-VN')} đ`))
      return
    }
    
    setSubmitting(true)
    try {
      const res = await createWithdrawRequest({
        amount: value,
        currency: 'VND',
        payoutType: 'nowpayment', // typical alternate payout
        data: {
          method: 'card',
          provider: selected,
        },
      })
      if (res.success) {
        toast.success(t('withdrawal.success', 'Đã gửi yêu cầu rút tiền.'))
        setAmount('')
      } else {
        toast.error(res.message || t('withdrawal.failed', 'Rút tiền thất bại'))
      }
    } catch (error: any) {
      toast.error(error.message || t('withdrawal.failed', 'Rút tiền thất bại'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', ACCOUNT_VIEW_FADE_CLASS)}>
      <FinancialNotice as="p">
        {t('withdrawal.cardNoticeReal', 'Mã thẻ sẽ được gửi vào Hộp thư sau khi yêu cầu được duyệt.')}
      </FinancialNotice>

      <div>
        <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-white">
          {t('withdrawal.cardProvider', 'Loại thẻ')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARD_PROVIDERS.slice(0, 3).map((cp) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => setSelected(cp.id)}
              className={cn(
                'p-4 rounded-2xl border text-center transition-colors',
                selected === cp.id ? 'border-primary bg-primary/10' : 'border-fin-line bg-fin-deep',
              )}
            >
              <img
                src={cp.icon}
                alt={cp.name}
                width={32}
                height={32}
                className="max-h-8 object-contain mx-auto"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <FormField
          label={`${t('deposit.amount')} (VND)`}
          type="number"
          value={amount}
          onChange={(e: any) => setAmount(e.target.value)}
          placeholder={t('withdrawal.enterAmountK', 'Nhập số tiền...')}
          icon={Coins}
        />
      </div>

      <Button
        type="submit"
        isLoading={submitting}
        className="w-full mt-8 shadow-glow-primary font-black uppercase tracking-widest"
        size="lg"
      >
        {t('sidebar.withdraw')}
      </Button>
    </form>
  )
}

export default WithdrawCard
