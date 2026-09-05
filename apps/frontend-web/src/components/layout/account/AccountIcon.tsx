import * as React from 'react'
import { cn } from '../../../lib/cn'

export interface AccountIconPairProps {
  item: any
  size?: number
  alt?: string
  active?: boolean
  className?: string
}

export const AccountIconPair: React.FC<AccountIconPairProps> = ({
  item,
  size = 22,
  alt = '',
  active = false,
  className,
}) => {
  const iconSrc = typeof item?.icon === 'string' ? item.icon : item?.iconSrc
  if (!iconSrc) return null

  return (
    <img
      src={iconSrc}
      alt={alt}
      width={size}
      height={size}
      className={cn('object-contain transition-opacity duration-200', active ? 'opacity-100' : 'opacity-70', className)}
    />
  )
}

export default AccountIconPair
