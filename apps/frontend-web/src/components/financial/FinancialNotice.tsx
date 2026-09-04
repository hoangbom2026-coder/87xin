import * as React from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'p'
}

/** Hộp ghi chú / cảnh báo trong luồng nạp-rút — viền tối, đồng bộ demo */
const FinancialNotice: React.FC<Props> = ({ children, className, as: Tag = 'div' }) => (
  <Tag className={cn('fin-notice', className)}>{children}</Tag>
)

export default FinancialNotice
