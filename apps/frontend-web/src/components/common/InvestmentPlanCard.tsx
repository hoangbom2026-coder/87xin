import * as React from 'react'
import { cn } from '../../lib/cn'
import Button from '../ui/Button'

type PlanFeature = {
  label: React.ReactNode
  value: React.ReactNode
  valueClassName?: string
}

interface InvestmentPlanCardProps {
  name: React.ReactNode
  profit: React.ReactNode
  hideTopHeader?: boolean
  payoutLabel?: React.ReactNode
  features: PlanFeature[]
  referrals?: string[]
  referralTitle?: React.ReactNode
  primaryActionLabel: React.ReactNode
  onPrimaryAction?: () => void
  secondaryActionLabel?: React.ReactNode
  onSecondaryAction?: () => void
  className?: string
}

const InvestmentPlanCard: React.FC<InvestmentPlanCardProps> = ({
  name,
  profit,
  hideTopHeader = false,
  payoutLabel,
  features,
  referrals = [],
  referralTitle,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}) => {
  return (
    <article className={cn('invest-plan-card fin-inset', className)}>
      {!hideTopHeader ? (
        <header className="invest-plan-card__top">
          <h3 className="invest-plan-card__name">{name}</h3>
        </header>
      ) : null}

      <div className="invest-plan-card__price">
        {hideTopHeader ? (
          <h3 className="invest-plan-card__name invest-plan-card__name--inline">{name}</h3>
        ) : null}
        <p className="invest-plan-card__amount">{profit}</p>
        {payoutLabel ? <span className="invest-plan-card__details">{payoutLabel}</span> : null}
      </div>

      <div className="invest-plan-card__body">
        <ul className="invest-plan-card__features">
          {features.map((feature, idx) => (
            <li key={idx}>
              <span className="caption">{feature.label}</span>
              <span className={cn('details', feature.valueClassName)}>{feature.value}</span>
            </li>
          ))}
        </ul>

        {referrals.length ? (
          <div className="invest-plan-card__referral">
            <p className="invest-plan-card__referral-title">{referralTitle}</p>
            <div className="invest-plan-card__referral-list">
              {referrals.map((value, idx) => (
                <span key={idx} className="invest-plan-card__referral-item">
                  F{idx + 1}: {value}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="invest-plan-card__action">
          <Button
            variant="primary"
            className="w-full !py-3 text-[10px] uppercase tracking-[0.2em]"
            onClick={onPrimaryAction}
          >
            {primaryActionLabel}
          </Button>
          {secondaryActionLabel ? (
            <Button
              variant="outline"
              className="w-full !py-3 text-[10px] uppercase tracking-[0.2em] mt-3"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default InvestmentPlanCard
