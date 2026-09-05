import * as React from 'react'

export interface PromoDetailModalProps {
  card?: any
  open?: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}
