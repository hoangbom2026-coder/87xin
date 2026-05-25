import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'
import Button from '../ui/Button'
import { StableImg } from '../ui/StableImg'
import {
  DEPOSIT_CRYPTO_NETWORKS,
  DEPOSIT_CRYPTO_PACKAGES,
} from '../../constants/financial'
import { type DepositCryptoNetwork } from '../../types'

const CryptoDepositPanel: React.FC = () => {
  const { t } = useLanguage()
  const [selectedId, setSelectedId] = React.useState(
    () => DEPOSIT_CRYPTO_NETWORKS.find((n) => !n.disabled)?.id ?? DEPOSIT_CRYPTO_NETWORKS[0]!.id,
  )
  const [packageId, setPackageId] = React.useState<string>(DEPOSIT_CRYPTO_PACKAGES[0]?.id ?? '1')
  const [exchangeOpen, setExchangeOpen] = React.useState(false)

  return (
    <form
      className="crypto-form"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
        <div className="crypto-form__steps">
          <div className="base-steps__wrapper">
            <div className="base-steps">
              <div className="base-steps__step base-steps__step--active">
                <div className="base-steps__step-icon base-steps__step-icon--active">
                  <span>1</span>
                </div>
                <div className="base-steps__step-title">
                  {t('deposit.cryptoStepPick', 'Chọn loại tiền ảo')}
                </div>
              </div>
              <div className="base-steps__line" aria-hidden />
              <div className="base-steps__step">
                <div className="base-steps__step-icon">
                  <span>2</span>
                </div>
                <div className="base-steps__step-title">
                  {t('deposit.cryptoStepConfirm', 'Xác nhận chuyển tiền')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="crypto-form__crypto-list">
          <div className="form-radio">
            <div className="form-radio__options">
              {DEPOSIT_CRYPTO_NETWORKS.map((net: DepositCryptoNetwork) => {
                const sel = selectedId === net.id && !net.disabled
                return (
                  <label
                    key={net.id}
                    className={cn(
                      'v-card v-card--link v-theme--light v-card--density-default v-card--variant-elevated form-radio-option',
                      net.disabled && 'form-radio-option--disabled',
                      sel && 'form-radio-option--selected',
                    )}
                  >
                    <div className="v-card__loader" aria-hidden>
                      <div
                        className="v-progress-linear v-theme--light v-locale--is-ltr h-0 overflow-hidden opacity-0"
                        role="progressbar"
                        aria-hidden="true"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{ ['--v-progress-linear-height' as string]: '2px', top: 0 }}
                      >
                        <div className="v-progress-linear__background" />
                        <div className="v-progress-linear__buffer" style={{ width: '0%' }} />
                        <div className="v-progress-linear__indeterminate">
                          <div className="v-progress-linear__indeterminate long" />
                          <div className="v-progress-linear__indeterminate short" />
                        </div>
                      </div>
                    </div>
                    {net.comingSoon ? (
                      <div className="form-radio-option__disabled-tag commming">
                        {t('deposit.cryptoComingSoon', 'Sắp ra mắt')}
                      </div>
                    ) : null}
                    <input
                      id={`crypto-${net.id}`}
                      type="radio"
                      name="crypto_id"
                      className="form-radio-option__input sr-only"
                      value={net.id}
                      checked={sel}
                      disabled={net.disabled}
                      onChange={() => {
                        if (!net.disabled) setSelectedId(net.id)
                      }}
                    />
                    <StableImg
                      src={net.icon}
                      alt=""
                      className={cn('form-radio-option__image', net.disabled && 'form-radio-option__image--disabled')}
                      loading="lazy"
                      width={48}
                      height={48}
                    />
                    <div
                      className={cn(
                        'form-radio-option__title',
                        net.disabled && 'form-radio-option__title--disabled',
                      )}
                    >
                      {net.name}
                    </div>
                    {net.rateLine ? (
                      <div className="form-radio-option__description">{net.rateLine}</div>
                    ) : (
                      <div className="form-radio-option__description" />
                    )}
                    <span className="v-card__overlay pointer-events-none" aria-hidden />
                    <span className="v-card__underlay pointer-events-none" aria-hidden />
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="crypto-form__promotion">
          <div className="form-radio">
            <label className="form-radio__label" htmlFor="package_id">
              {t('deposit.cryptoPromoPackage', 'Gói khuyến mãi')}
            </label>
            <div className="form-radio__options form-radio__options--single">
              {DEPOSIT_CRYPTO_PACKAGES.map((pkg) => {
                const sel = packageId === pkg.id
                return (
                  <label
                    key={pkg.id}
                    className={cn(
                      'v-card v-card--link v-theme--light v-card--density-default v-card--variant-elevated form-radio-option',
                      sel && 'form-radio-option--selected',
                    )}
                  >
                    <div className="v-card__loader" aria-hidden>
                      <div
                        className="v-progress-linear v-theme--light v-locale--is-ltr h-0 overflow-hidden opacity-0"
                        role="progressbar"
                        aria-hidden="true"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{ ['--v-progress-linear-height' as string]: '2px', top: 0 }}
                      >
                        <div className="v-progress-linear__background" />
                        <div className="v-progress-linear__buffer" style={{ width: '0%' }} />
                        <div className="v-progress-linear__indeterminate">
                          <div className="v-progress-linear__indeterminate long" />
                          <div className="v-progress-linear__indeterminate short" />
                        </div>
                      </div>
                    </div>
                    <input
                      id={pkg.id === DEPOSIT_CRYPTO_PACKAGES[0]?.id ? 'package_id' : `package-${pkg.id}`}
                      type="radio"
                      name="package_id"
                      className="form-radio-option__input sr-only"
                      value={pkg.id}
                      checked={sel}
                      onChange={() => setPackageId(pkg.id)}
                    />
                    <div className="form-radio-option__title">{pkg.title}</div>
                    <div className="form-radio-option__description">{pkg.description}</div>
                    <span className="v-card__overlay pointer-events-none" aria-hidden />
                    <span className="v-card__underlay pointer-events-none" aria-hidden />
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="crypto-form__note">
          <div className="crypto-form__note-label">{t('deposit.cryptoNoteTitle', 'Lưu ý')}</div>
          <ul className="crypto-form__note-text">
            <li>{t('deposit.cryptoNote1', 'Quý khách vui lòng gửi đúng loại tiền vào địa chỉ ví đã chọn.')}</li>
            <li>
              <span className="crypto-form__note-text--highlight">9BET</span>{' '}
              {t(
                'deposit.cryptoNote2',
                'sẽ không chịu trách nhiệm nếu bạn gửi sai loại tiền hoặc sai địa chỉ ví.',
              )}
            </li>
          </ul>
        </div>

        <div className="crypto-form__exchange">
          <div className="v-expansion-panels v-theme--light v-expansion-panels--variant-default">
            <div className={cn('v-expansion-panel', exchangeOpen && 'v-expansion-panel--active')}>
              <div className="v-expansion-panel__shadow" aria-hidden />
              <Button
                variant="ghost"
                type="button"
                className="v-expansion-panel-title w-full text-left"
                aria-expanded={exchangeOpen}
                id="crypto-exchange-title"
                onClick={() => setExchangeOpen((o) => !o)}
              >
                <span className="v-expansion-panel-title__overlay pointer-events-none" aria-hidden />
                <div className="crypto-form__exchange-title">
                  {t('deposit.cryptoExchangeTitle', 'Truy cập sàn giao dịch')}
                </div>
                <span className="v-expansion-panel-title__icon flex shrink-0 items-center text-text-muted">
                  <ChevronDown
                    size={20}
                    className={cn('transition-transform duration-200', exchangeOpen && 'rotate-180')}
                    aria-hidden
                  />
                </span>
              </Button>
              <div className="v-expansion-panel-text" style={{ display: exchangeOpen ? undefined : 'none' }}>
                <div className="crypto-form__exchange-body px-3 pb-3 text-xs text-text-muted">
                  {t('deposit.cryptoExchangePlaceholder', 'Nội dung sàn giao dịch sẽ được cập nhật.')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="crypto-form__footer">
          <Button
            variant="primary"
            type="submit"
            className="w-full !py-3.5 rounded-2xl shadow-glow-primary active:scale-95"
            disabled
            id="submit-transaction"
            name="submit-transaction"
            aria-label={t('common.confirm', 'Xác nhận')}
          >
            {t('common.confirm', 'Xác nhận')}
          </Button>
        </div>
    </form>
  )
}

export default CryptoDepositPanel
