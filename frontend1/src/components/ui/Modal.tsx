import * as React from 'react'
import { LucideIcon, X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  open: boolean
  onClose: () => void
  size?: ModalSize
  closeOnBackdrop?: boolean
  showClose?: boolean
  children: React.ReactNode
  className?: string
}

const SIZE: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  size = 'sm',
  closeOnBackdrop = true,
  showClose = false,
  children,
  className = '',
}) => {
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className={`bg-secondary-dark border border-transparent rounded-3xl p-8 w-full ${SIZE[size]} animate-in zoom-in-95 duration-300 relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-gray hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

interface DialogProps {
  open: boolean
  onClose: () => void
  icon?: LucideIcon
  variant?: 'info' | 'danger' | 'success'
  title: string
  message?: React.ReactNode
}

interface ConfirmModalProps extends DialogProps {
  cancelLabel?: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
}

const VARIANT_BG: Record<NonNullable<DialogProps['variant']>, string> = {
  info: 'bg-primary/10 text-primary',
  danger: 'bg-red-500/10 text-red-500',
  success: 'bg-emerald-500/10 text-emerald-400',
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open, onClose, icon: Icon, variant = 'info',
  title, message,
  cancelLabel, confirmLabel,
  onConfirm, loading = false,
}) => {
  const { t } = useLanguage()
  const finalCancel = cancelLabel ?? t('common.cancel', 'Cancel')
  const finalConfirm = confirmLabel ?? t('common.confirm', 'Confirm')
  return (
    <Modal open={open} onClose={onClose} size="sm">
      {Icon && (
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-transparent ${VARIANT_BG[variant]}`}>
          <Icon size={40} />
        </div>
      )}
      <h3 className="text-white font-black text-2xl text-center uppercase mb-5 italic">{title}</h3>
      {message && (
        <div className="text-center p-6 bg-white/5 rounded-2xl border border-transparent mb-8">
          <p className="text-text-muted text-sm leading-relaxed font-medium">{message}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="py-3 rounded-xl bg-white/5 text-text-gray font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-transparent disabled:opacity-50"
        >
          {finalCancel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn-standard btn-primary !py-3 rounded-xl !text-[10px] active:scale-95 disabled:opacity-50"
        >
          {loading ? t('common.processing', 'Processing...') : finalConfirm}
        </button>
      </div>
    </Modal>
  )
}

interface AlertModalProps extends DialogProps {
  ctaLabel?: string
  onCta?: () => void
}

export const AlertModal: React.FC<AlertModalProps> = ({
  open, onClose, icon: Icon, variant = 'info',
  title, message, ctaLabel, onCta,
}) => {
  const { t } = useLanguage()
  const finalCta = ctaLabel ?? t('common.close', 'Close')
  return (
    <Modal open={open} onClose={onClose} size="sm">
      {Icon && (
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-transparent ${VARIANT_BG[variant]}`}>
          <Icon size={40} />
        </div>
      )}
      <h3 className="text-white font-black text-2xl text-center uppercase mb-5 italic">{title}</h3>
      {message && (
        <p className="text-text-muted text-sm text-center mb-8 leading-relaxed font-medium">{message}</p>
      )}
      <button
        onClick={onCta || onClose}
        className="btn-standard btn-primary w-full !py-3 rounded-xl !text-[11px] active:scale-95"
      >
        {finalCta}
      </button>
    </Modal>
  )
}

export default Modal
