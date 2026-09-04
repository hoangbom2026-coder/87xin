import * as React from 'react'
import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'

export interface PaymentMethodTabItem {
  id: string
  label: string
  icon: LucideIcon
  maintenance?: boolean
}

export interface PaymentMethodTabsProps {
  /** Ví dụ `/deposit` hoặc `/withdraw` */
  basePath: string
  queryKey?: string
  activeId: string
  items: PaymentMethodTabItem[]
  /** `aria-label` cho `<nav>` */
  ariaLabel: string
  /** `deposit`: hàng tab full-width; `withdraw`: giữ overflow ngang (scroll) */
  variant?: 'deposit' | 'withdraw'
}

const PaymentMethodTabs: React.FC<PaymentMethodTabsProps> = ({
  basePath,
  queryKey = 'method',
  activeId,
  items,
  ariaLabel,
  variant = 'deposit',
}) => {
  const { t } = useLanguage()

  const navClass =
    variant === 'withdraw'
      ? 'account-method-tabs mb-8 flex overflow-x-auto border-b border-fin-line no-scrollbar'
      : 'account-method-tabs flex w-full max-w-full flex-row flex-wrap items-stretch border-b border-fin-line'

  const tabClass = (active: boolean) =>
    variant === 'withdraw'
      ? cn(
          'account-method-tab relative whitespace-nowrap border-b-2 px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:text-primary',
          active ? 'border-primary text-primary' : 'border-transparent text-text-gray',
        )
      : cn(
          'account-method-tab relative flex h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap border-b-2 px-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base',
          active
            ? 'border-primary text-primary'
            : 'border-transparent text-text-gray hover:border-primary/40 hover:text-primary',
        )

  return (
    <nav className={navClass} aria-label={ariaLabel}>
      {items.map((m) => {
        const active = activeId === m.id
        return (
          <NavLink
            key={m.id}
            to={{ pathname: basePath, search: `?${queryKey}=${m.id}` }}
            className={tabClass(active)}
            aria-current={active ? 'page' : undefined}
          >
            {m.maintenance ? (
              <span className="absolute -top-1 right-0 sm:-top-2">
                <span className="flex h-5 min-w-[4.5rem] items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-gray ring-1 ring-white/10 sm:h-6 sm:text-xs">
                  {t('deposit.maintenance')}
                </span>
              </span>
            ) : null}
            <span className={variant === 'withdraw' ? 'flex items-center gap-2' : 'flex items-center gap-2'}>
              <m.icon className={variant === 'withdraw' ? undefined : 'size-4 shrink-0 opacity-90'} size={variant === 'withdraw' ? 14 : undefined} aria-hidden />
              {m.label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default PaymentMethodTabs
