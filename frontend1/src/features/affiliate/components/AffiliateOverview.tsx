import * as React from 'react'
import { Zap, Wallet } from 'lucide-react'
import Button from '../../../components/ui/Button'
import DataTableSection from '../../../components/common/DataTableSection'
import PlanSection from '../../../components/common/PlanSection'
import { AffiliateOverviewData, claimAffiliateCommission } from '../../../services/affiliateService'
import { toast } from '../../../utils/toast'
import { QRCodeSVG } from 'qrcode.react'

interface AffiliateOverviewProps {
  t: (k: string, d?: string) => string
  formatBalance: (amount?: number | string) => string
  handleCopyLink: () => void
  investmentPlans: any[]
  renderPlanCard: (plan: any) => React.ReactNode
  recentCommissions: any[]
  data?: AffiliateOverviewData | null
}

const AffiliateOverview: React.FC<AffiliateOverviewProps> = ({
  t,
  formatBalance,
  handleCopyLink,
  investmentPlans,
  renderPlanCard,
  recentCommissions,
  data,
}) => {
  const [claiming, setClaiming] = React.useState(false)

  const handleClaim = async () => {
    if (!data?.unclaimedBalance || data.unclaimedBalance <= 0) return
    setClaiming(true)
    try {
      const res = await claimAffiliateCommission()
      if (res.success) {
        toast.success(`Đã nhận ${formatBalance(res.data.amount)} vào ví!`)
        window.location.reload() // Reload để cập nhật số dư
      } else {
        toast.error(res.message || 'Lỗi khi nhận hoa hồng')
      }
    } catch {
      toast.error('Lỗi hệ thống')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 4 ô thống kê chính */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data?.details.map((item, idx) => (
          <div key={idx} className="fin-inset p-4 flex flex-col items-center text-center gap-2">
            <div className="text-text-gray text-[10px] font-black uppercase tracking-widest">{item.label}</div>
            <div className="text-white font-black text-xl md:text-2xl text-glow-primary">
              {item.isMoney ? formatBalance(item.value) : item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Ô nhận hoa hồng */}
      <div className="fin-panel py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-fin-line">
            <Wallet size={24} />
          </div>
          <div>
            <span className="block text-text-gray text-[10px] font-black uppercase tracking-widest mb-1">Hoa hồng chưa nhận</span>
            <span className="block text-white text-2xl font-black">{formatBalance(data?.unclaimedBalance || 0)}</span>
          </div>
        </div>
        <Button
          onClick={handleClaim}
          disabled={claiming || !data?.unclaimedBalance || data.unclaimedBalance <= 0}
          className="px-10 py-4 italic"
          variant="primary"
        >
          {claiming ? 'Đang xử lý...' : 'Nhận thu nhập'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="fin-panel p-6 md:p-10 hover:bg-fin-surface/90 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-all" />
          <h3 className="text-white font-black text-2xl uppercase mb-6 leading-tight italic">
            {t('affiliate.buildCasinoTitle')}
          </h3>
          <p className="text-text-muted text-sm md:text-base font-medium leading-relaxed mb-6">
            {t('affiliate.buildCasinoText')}
          </p>
        </div>

        <div className="fin-panel p-6 md:p-10 hover:bg-fin-surface/90 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/10 transition-all" />
          <h3 className="text-white font-black text-2xl uppercase mb-6 leading-tight italic">
            {t('affiliate.ownDomainTitle')}
          </h3>
          <p className="text-text-muted text-sm md:text-base font-medium leading-relaxed mb-6">
            {t('affiliate.ownDomainText')}
          </p>
        </div>
      </div>

      <div className="fin-panel py-6 px-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-white font-black text-2xl md:text-4xl uppercase mb-6 italic tracking-tighter">
            <span className="text-primary text-glow">{t('sidebar.affiliate', 'Affiliate')}</span> {t('affiliate.rewardTitle')}
          </h2>
          <p className="text-text-muted max-w-3xl mx-auto mb-10 text-sm md:text-lg font-medium leading-relaxed">
            {t('affiliate.rewardText')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleCopyLink}
              className="!px-12 italic"
            >
              {t('affiliate.createCode')}
            </Button>
            {data?.inviteCode && (
              <div className="fin-inset px-6 flex items-center justify-center border border-dashed border-primary/30 group relative">
                <span className="text-primary font-black text-xl tracking-widest">{data.inviteCode}</span>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded shadow-xl z-20 pointer-events-none">
                  <QRCodeSVG value={data.inviteLink} size={128} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PlanSection
        className="agency-surface-card p-6 md:p-10 rounded-2xl"
        title={t('agency.plans', 'Partner Investment Plans')}
        subtitle={t('agency.plansSubtitle', 'Pick the investment plan that fits you')}
        plans={investmentPlans}
        renderPlan={(plan) => renderPlanCard(plan)}
      />

      <div className="space-y-10">
        <div className="text-center">
          <h2 className="text-white font-black text-2xl uppercase italic tracking-tight flex items-center justify-center gap-4 italic">
            <Zap className="text-primary animate-pulse" size={28} />
            {t('affiliate.liveCommissions')}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[recentCommissions, [...recentCommissions].reverse()].map((data, idx) => (
            <DataTableSection key={idx} className="fin-inset" tableMinWidthClassName="min-w-[560px]">
              <div>
                <table className="w-full min-w-[520px] sm:min-w-[560px] text-left">
                  <thead>
                    <tr className="bg-white/5 text-text-gray text-[10px] font-black uppercase tracking-widest">
                      <th className="p-6">{t('affiliate.tablePartner')}</th>
                      <th className="p-6 text-center">{t('affiliate.tableAmount')}</th>
                      <th className="p-6 text-right">{t('affiliate.tableTime')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-fin-surface/80 transition-colors group">
                        <td className="p-6 text-white font-bold group-hover:text-primary transition-colors">{row.player}</td>
                        <td className="p-6 text-center text-primary font-black text-glow-primary">{formatBalance(parseInt(row.amount.replace(/,/g, '')))}</td>
                        <td className="p-6 text-right text-text-gray italic font-medium">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataTableSection>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AffiliateOverview
