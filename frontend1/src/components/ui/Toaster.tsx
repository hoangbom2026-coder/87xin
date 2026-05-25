import * as React from 'react'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useToasts, type ToastKind } from '../../utils/toast'

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error:   <AlertTriangle size={18} />,
  info:    <Info size={18} />,
}

const TONES: Record<ToastKind, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  info:    'border-primary/30 bg-primary/10 text-primary',
}

const Toaster: React.FC = () => {
  const toasts = useToasts()

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed left-1/2 top-4 z-[10000] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-2 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${TONES[t.kind]} px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <span className="mt-0.5 shrink-0">{ICONS[t.kind]}</span>
          <p className="leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  )
}

export default Toaster
