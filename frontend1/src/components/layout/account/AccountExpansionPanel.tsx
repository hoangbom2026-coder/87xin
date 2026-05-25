import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { AccountSidebarItem } from './AccountSidebarItem'
import { AccountChildRow } from './AccountChildRow'
import type { AccountMenuItem, AccountMenuChild } from '../../../types'

interface AccountExpansionPanelProps {
  item: AccountMenuItem
  isOpen: boolean
  onToggle: () => void
  active: boolean
  pathname: string
  search: string
  isAfterActive?: boolean
  panelIdPrefix?: string
  childActiveChecker: (pathname: string, search: string, child: AccountMenuChild) => boolean
}

/**
 * Component đóng gói Expansion Panel cho Sidebar Account.
 * Xử lý logic hiển thị tiêu đề chuẩn và danh sách các mục con.
 */
export const AccountExpansionPanel: React.FC<AccountExpansionPanelProps> = ({
  item,
  isOpen,
  onToggle,
  active,
  pathname,
  search,
  isAfterActive = false,
  panelIdPrefix = 'acc-panel',
  childActiveChecker,
}) => {
  return (
    <div
      className={cn(
        'v-expansion-panel',
        isOpen && 'v-expansion-panel--active',
        isAfterActive && 'v-expansion-panel--after-active'
      )}
    >
      <div className="v-expansion-panel__shadow" aria-hidden />
      
      <AccountSidebarItem
        item={item}
        active={isOpen || active}
        onClick={onToggle}
        className={cn(
          'v-expansion-panel-title',
          (isOpen || active) && 'v-expansion-panel-title--active'
        )}
      >
        <ChevronDown
          size={18}
          strokeWidth={2.25}
          className={cn(
            'v-expansion-panel-title__icon transition-transform duration-200 ease-out ml-auto',
            isOpen && 'rotate-180'
          )}
        />
      </AccountSidebarItem>

      {isOpen && item.children && (
        <div className="v-expansion-panel-text">
          <div className="v-expansion-panel-text__wrapper">
            <ul id={`${panelIdPrefix}-${item.id}`} className="menu-tabs menu-tabs--panel-nested">
              {item.children.map((c) => (
                <li key={c.id} className="menu-tabs__item">
                  <AccountChildRow child={c} active={childActiveChecker(pathname, search, c)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
