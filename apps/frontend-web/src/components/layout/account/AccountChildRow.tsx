import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../../lib/cn'
import { useLanguage } from '../../../i18n/LanguageContext'

export interface AccountChildRowProps {
  child: any
  active: boolean
  onClick?: () => void
  className?: string
}

export const AccountChildRow: React.FC<AccountChildRowProps> = ({
  child,
  active,
  onClick,
  className,
}) => {
  const { t } = useLanguage()
  const label = t(child.i18nKey, child.fallback || child.label)

  return (
    <NavLink
      to={child.path || child.href || '#'}
      onClick={onClick}
      className={cn(
        'v-expansion-panel-content__item flex items-center px-4 py-2 text-sm text-text-muted hover:text-white transition-colors',
        active && 'text-primary font-semibold',
        className
      )}
    >
      <span>{label}</span>
    </NavLink>
  )
}

export default AccountChildRow
