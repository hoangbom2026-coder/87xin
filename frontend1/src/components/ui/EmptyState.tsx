import * as React from 'react'
import { LucideIcon, Inbox } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

type EmptyStateVariant = 'block' | 'cell'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  message?: string
  variant?: EmptyStateVariant
  colSpan?: number
  className?: string
}

const Body: React.FC<{ Icon?: LucideIcon; title?: string; message?: string }> = ({ Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center gap-4 opacity-50">
    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-transparent">
      {Icon ? <Icon size={28} className="text-text-gray" /> : <Inbox size={28} className="text-text-gray" />}
    </div>
    {title && <p className="text-text-muted text-xs font-black uppercase tracking-widest italic">{title}</p>}
    {message && <p className="text-text-gray text-[11px] font-medium">{message}</p>}
  </div>
)

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon, title, message,
  variant = 'block', colSpan = 6, className = '',
}) => {
  const { t } = useLanguage()
  const finalTitle = title ?? t('common.noData', 'No data found.')
  if (variant === 'cell') {
    return (
      <tr>
        <td colSpan={colSpan} className={`px-6 py-20 text-center ${className}`}>
          <Body Icon={Icon} title={finalTitle} message={message} />
        </td>
      </tr>
    )
  }
  return (
    <div className={`py-16 ${className}`}>
      <Body Icon={Icon} title={finalTitle} message={message} />
    </div>
  )
}

export default EmptyState
