import * as React from 'react'
import { AccountBaseRow } from './AccountBaseRow'
import type { AccountMenuItem } from '../../../types'

interface AccountSidebarItemProps {
  item: AccountMenuItem
  active: boolean
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  asNavLink?: boolean
}

/**
 * Component chuẩn hóa cho các mục menu cấp 1 trong Sidebar.
 */
export const AccountSidebarItem: React.FC<AccountSidebarItemProps> = (props) => {
  return (
    <AccountBaseRow
      {...props}
      path={props.item.path}
      showIconWrap={true}
      iconSize={22}
    />
  )
}
