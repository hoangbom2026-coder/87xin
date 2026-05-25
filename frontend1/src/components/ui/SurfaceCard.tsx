import * as React from 'react'
import { cn } from '../../lib/cn'

type SurfaceVariant = 'panel' | 'inset'

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
  as?: keyof JSX.IntrinsicElements
}

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  panel: 'fin-panel',
  inset: 'fin-inset',
}

export default function SurfaceCard({
  variant = 'panel',
  as,
  className,
  ...props
}: SurfaceCardProps) {
  const Comp = (as || 'div') as any
  return <Comp className={cn(VARIANT_CLASS[variant], className)} {...props} />
}
