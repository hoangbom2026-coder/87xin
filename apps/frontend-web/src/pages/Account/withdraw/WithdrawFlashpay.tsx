import * as React from 'react'
import { useState } from 'react'
import { Coins } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useSite } from '../../../hooks/useSite'
import FinancialNotice from '../../../components/financial/FinancialNotice'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { createWithdrawRequest } from '../../../services/withdrawService'
import { toast } from '../../../utils/toast'
import { cn } from '../../../lib/cn'
import { ACCOUNT_VIEW_FADE_CLASS } from '../../../constants/pageShell'

/** `/withdraw?method=flashpay` — QR Flashpay */
const WithdrawFlashpay: React.FC = () => {
  const { t } = useLanguage()
  const { siteData } = useSite()
  const [accountName, setAccountName] = useState('')
  const [flashpayId, setFlashpayId] = useState('')
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
    if (!accountName.trim() || !flashpayId.trim()) {
      toast.error(t('common.fillAll', 'Vui lòng điền đầy đủ thông tin'))
      return
    }
    
    setSubmitting(true)
    try {
      const res = await createWithdrawRequest({
        amount: value,
        currency: 'VND',
        payoutType: 'nowpayment',
        data: {
          method: 'flashpay',
          accountName: accountName.trim(),
          flashpayId: flashpayId.trim(),
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
      <FinancialNotice as="p">{t('withdrawal.flashpayNoticeReal', 'Nhập Flashpay ID để nhận tiền ngay lập tức.')}</FinancialNotice>
      
      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          label={t('bank.accountHolder', 'Chủ tài khoản')}
          value={accountName}
          onChange={(e: any) => setAccountName(e.target.value)}
          placeholder="NGUYEN VAN A"
        />
        <FormField
          label="Flashpay ID"
          value={flashpayId}
          onChange={(e: any) => setFlashpayId(e.target.value)}
          placeholder="FP-123456"
        />
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

export default WithdrawFlashpay
