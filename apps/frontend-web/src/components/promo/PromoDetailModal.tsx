import * as React from 'react'
import { cn } from '../../lib/cn'
import { useLanguage } from '../../i18n/LanguageContext'
import type { PromoDetailModalProps } from './types'
import PromoModalDefaultTnc from './PromoModalDefaultTnc'

/**
 * Modal khuyến mãi dùng chung — markup legacy:
 * `.modal-content.promo` → `.close-promo` → `.promo-body` → `.promo-text` → `.pm-title-wrapper`
 */
const PromoDetailModal: React.FC<PromoDetailModalProps> = ({
  card = null,
  open,
  onClose,
  title,
  children,
  footer,
}) => {
  const { t } = useLanguage()
  const cardMode = card !== undefined
  const isOpen = cardMode ? card != null : !!open

  React.useEffect(() => {
    if (!isOpen) return
    document.body.classList.add('no-scroll')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const displayTitle =
    title?.trim() ||
    card?.modalTitle ||
    card?.searchTitle ||
    (typeof card?.title === 'string' ? card.title : '') ||
    t('promotions.title', 'Promotion')

  const body =
    children ??
    (card ? card.modalBody ?? <PromoModalDefaultTnc lead={card.description} /> : null)

  return (
    <div
      className="t-modal promo-detail-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-detail-title"
      onClick={onClose}
    >
      <div className="modal-dialog promo promo-detail-modal__dialog" onClick={(e) => e.stopPropagation()}>
        <div
          className={cn(
            'modal-content promo promo-detail-modal__panel',
            footer && 'promo-detail-modal__panel--with-footer',
          )}
        >
          <button type="button" className="close-promo" aria-label={t('common.close', 'Close')} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
          <div className="promo-body">
            <div className="promo-text">
              <div id="promo-detail-title" className="pm-title-wrapper">
                {displayTitle}
              </div>
              <div className="promo-text__scroll">{body}</div>
              {footer ? <div className="promo-modal__footer">{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoDetailModal
