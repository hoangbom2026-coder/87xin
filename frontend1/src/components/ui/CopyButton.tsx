import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from '../../utils/toast'
import { cn } from '../../lib/cn'

interface CopyButtonProps {
  text: string
  className?: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, className }) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Đã sao chép')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center p-1.5 rounded-lg transition-colors hover:bg-white/10 text-text-gray hover:text-primary',
        className
      )}
      aria-label="Sao chép"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}
