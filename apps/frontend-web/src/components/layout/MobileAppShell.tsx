import * as React from 'react'
import { cn } from '../../lib/cn'

interface MobileAppShellProps {
  children: React.ReactNode
  className?: string
}

/** Khung mobile 480px căn giữa trên PC — khớp Set52 (nền đen ngoài, #121317 trong). */
const MobileAppShell: React.FC<MobileAppShellProps> = ({ children, className }) => (
  <div className={cn('flex min-h-screen w-full items-start justify-center bg-black', className)}>
    <div
      className={cn(
        'relative flex min-h-screen w-full flex-col overflow-x-hidden',
        'bg-bg-main font-sans text-white',
        'max-w-full sm:max-w-[480px]',
        'selection:bg-brand-red/30',
        'lg:max-w-none',
      )}
    >
      {children}
    </div>
  </div>
)

export default MobileAppShell
