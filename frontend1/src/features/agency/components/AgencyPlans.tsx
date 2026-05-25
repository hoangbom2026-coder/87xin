import * as React from 'react'
import { useLanguage } from '../../../i18n/LanguageContext'
import InvestmentPlanCard from '../../../components/common/InvestmentPlanCard'
import Loading from '../../../components/ui/Loading'

interface AgencyPlanCard {
  _id: string | null
  name: string
  profit: string
  min?: string
  max?: string
  amount?: string
  period: string
  type: string
  capitalBack: string
  referrals: string[]
}

interface AgencyPlansProps {
  displayPlans: AgencyPlanCard[]
  apiPlansLoading: boolean
  handlePlanAction: (plan: AgencyPlanCard, mode: 'invest' | 'transfer') => void
}

const AgencyPlans: React.FC<AgencyPlansProps> = ({
  displayPlans,
  apiPlansLoading,
  handlePlanAction,
}) => {
  const { t } = useLanguage()

  if (apiPlansLoading) {
    return <Loading variant="section" text={t('common.loading', 'Loading plans...')} />
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {displayPlans.map((plan, i) => (
        <InvestmentPlanCard
          key={plan._id || i}
          name={plan.name}
          profit={plan.profit}
          payoutLabel={plan.type}
          features={[
            { label: t('agency.min', 'Min'), value: plan.min || plan.amount },
            { label: t('agency.max', 'Max'), value: plan.max || t('agency.fixed', 'Cố định') },
            { label: t('agency.cycle', 'Chu kỳ'), value: plan.period },
            { label: t('agency.capitalBack', 'Gốc'), value: plan.capitalBack },
          ]}
          primaryActionLabel={t('agency.investNow', 'Invest Now')}
          secondaryActionLabel={t('sidebar.deposit', 'Deposit')}
          onPrimaryAction={() => handlePlanAction(plan, 'invest')}
          onSecondaryAction={() => handlePlanAction(plan, 'transfer')}
          referrals={plan.referrals}
          referralTitle={t('agency.referralReward', 'Thưởng liên kết')}
        />
      ))}
    </div>
  )
}

export default AgencyPlans
