import * as React from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'hot' | 'new' | 'default'

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  hot: 'bg-red-600 text-white',
  new: 'bg-emerald-600 text-white',
  default: 'bg-white/10 text-white/80',
}

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
      VARIANT_CLASS[variant],
      className,
    )}
  >
    {children}
  </span>
)

export default Badge
