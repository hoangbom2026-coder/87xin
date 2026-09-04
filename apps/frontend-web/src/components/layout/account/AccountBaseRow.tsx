import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../../lib/cn'
import { AccountIconPair } from './AccountIcon'
import { useLanguage } from '../../../i18n/LanguageContext'
import type { AccountMenuItem } from '../../../types'

export interface AccountBaseRowProps {
  item: AccountMenuItem | any
  active: boolean
  onClick?: () => void
  children?: React.ReactNode // Extra elements like chevrons
  className?: string
  asNavLink?: boolean
  showIconWrap?: boolean // Main items have a boxed icon wrap
  iconSize?: number
  path?: string
  maintenance?: boolean
}

/**
 * Component gốc (Base) cho tất cả các dòng menu trong Account.
 * Tập trung logic hiển thị: Link/Button/Maintenance, Icon, Label, Badge.
 * Đây là trái tim của sự chuẩn hóa, giúp code cực kỳ sạch và dễ bảo trì.
 */
export const AccountBaseRow: React.FC<AccountBaseRowProps> = ({
  item,
  active,
  onClick,
  children,
  className,
  asNavLink = false,
  showIconWrap = false,
  iconSize = 22,
  path,
  maintenance = false,
}) => {
  const { t } = useLanguage()
  const label = t(item.i18nKey, item.fallback)

  const content = (
    <>
      {showIconWrap ? (
        <div className="header-menu-tabs__icon-wrap">
          <AccountIconPair item={item} size={iconSize} alt={label} active={active} />
        </div>
      ) : (
        <AccountIconPair item={item} size={iconSize} alt={label} active={active} />
      )}
      
      <span className="truncate">{label}</span>
      
      {maintenance && (
        <div className="menu-tabs__maintance ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">
          {t('deposit.maintenance', 'Bảo trì')}
        </div>
      )}
      
      {children}
    </>
  )

  const commonClass = cn(
    'menu-tabs__item__link header-menu-tabs group transition-all duration-300',
    maintenance && 'is-maintenance cursor-not-allowed opacity-70',
    active
      ? 'menu-tabs__item__link--active bg-white/[0.06] text-white shadow-[inset_3px_0_0_var(--primary)]'
      : 'text-text-muted hover:bg-white/[0.03] hover:text-white',
    className
  )

  if (maintenance) {
    return <span className={commonClass}>{content}</span>
  }

  if (asNavLink && path) {
    return (
      <NavLink to={path} className={commonClass} onClick={onClick}>
        {content}
      </NavLink>
    )
  }

  return (
    <button type="button" className={commonClass} onClick={onClick}>
      {content}
    </button>
  )
}
