import * as React from 'react'
import { useDispatch } from 'react-redux'
import { LogOut } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { logout } from '../../../features/auth/authSlice'
import { cn } from '../../../lib/cn'

interface AccountLogoutButtonProps {
  id?: string
  className?: string
}

/**
 * Component nút Đăng xuất chuẩn hóa cho Sidebar.
 * Áp dụng đúng phong cách: h-56px, font-bold uppercase, hiệu ứng hover primary.
 */
export const AccountLogoutButton: React.FC<AccountLogoutButtonProps> = ({
  id = 'open-logout-modal',
  className,
}) => {
  const { t } = useLanguage()
  const dispatch = useDispatch()

  return (
    <li className="menu-tabs__item menu-tabs__item--logout px-4 py-6 list-none">
      <button
        type="button"
        id={id}
        name={id}
        aria-label="Logout"
        onClick={() => dispatch(logout())}
        className={cn(
          'btn-standard btn-outline w-full flex items-center justify-center gap-2',
          'border-white/5 bg-white/2 hover:border-primary/30 hover:bg-primary/5 hover:text-primary',
          'transition-all duration-300 h-[56px] rounded-xl font-bold uppercase tracking-wider text-[13px]',
          className
        )}
      >
        <LogOut size={16} />
        {t('common.logout', 'Logout')}
      </button>
    </li>
  )
}
