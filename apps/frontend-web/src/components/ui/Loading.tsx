import * as React from 'react'
import { cn } from '../../lib/cn'

type LoadingVariant = 'page' | 'block' | 'section' | 'inline' | 'cell'
type LoadingSize = 'sm' | 'md' | 'lg' | 'xl'

interface LoadingProps {
  variant?: LoadingVariant
  size?: LoadingSize
  text?: string
  colSpan?: number
  className?: string
}

const SIZES: Record<LoadingSize, string> = {
  sm: 'scale-[0.4]',
  md: 'scale-[0.6]',
  lg: 'scale-[1.0]',
  xl: 'scale-[1.5]',
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'block', size = 'lg', text, colSpan = 6, className = '',
}) => {
  const spinner = (
    <div className={cn('loader-quantum', SIZES[size])}>
      <div className="loader-quantum-core" />
    </div>
  )

  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-3', className)}>
        {spinner}
        {text && <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{text}</span>}
      </div>
    )
  }

  if (variant === 'cell') {
    return (
      <tr>
        <td colSpan={colSpan} className={cn('py-12 text-center', className)}>
          <div className="flex flex-col items-center gap-4">
            {spinner}
            {text && <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{text}</span>}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className={cn('py-16 flex flex-col items-center justify-center gap-6 w-full', className, variant === 'page' ? 'min-h-[50vh]' : '')}>
      {spinner}
      {text && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">{text}</span>
          <div className="w-24 h-[1px] bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary shimmer" />
          </div>
        </div>
      )}
    </div>
  )
}

export default Loading
