import * as React from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const VARIANT: Record<BadgeVariant, string> = {
  default: 'border-fin-line bg-white/5 text-text-gray',
  primary: 'border-primary/25 bg-primary/10 text-primary',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  danger: 'border-red-500/25 bg-red-500/10 text-red-300',
}

export default function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border',
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  )
}
