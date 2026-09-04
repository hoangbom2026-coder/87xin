import * as React from 'react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'
import 'swiper/css'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useSite } from '../../../hooks/useSite'
import { cn } from '../../../lib/cn'
import { toast } from '../../../utils/toast'

const QUICK_K = [500, 1000, 5000, 50000, 299000] as const

const PACKAGES = [
  { id: '1', title: 'Hoàn trả 1.2%', description: 'Không giới hạn' },
  { id: '2', title: 'Thưởng 150%', description: 'Nạp lần đầu' },
] as const

/**
 * `/deposit?method=tpay` — nạp QR Fastpay.
 * Hỗ trợ `?promotion=1` (SubHeader back do `SubHeader` xử lý).
 */
const DepositTpay: React.FC = () => {
  const { t } = useLanguage()
  const { siteData } = useSite()
  const [searchParams] = useSearchParams()
  const promotion = searchParams.get('promotion') === '1'

  const [amountRaw, setAmountRaw] = useState('')
  const [packageId, setPackageId] = useState<string>('1')

  const minDepositVnd = siteData?.site?.transactionLimits?.minDepositVnd || 10000;
  const minDepositK = minDepositVnd / 1000;

  const kNum = useMemo(() => {
    const d = amountRaw.replace(/\D/g, '').slice(0, 9)
    if (!d) return NaN
    return Math.floor(Number(d))
  }, [amountRaw])

  const vnd = useMemo(
    () => (Number.isFinite(kNum) ? kNum * 1000 : 0),
    [kNum],
  )

  const amountValid = Number.isFinite(kNum) && kNum >= minDepositK

  const onInput = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 9)
    setAmountRaw(digits)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amountValid) {
      toast.error(t('deposit.invalidAmount', `Số tiền tối thiểu ${minDepositVnd.toLocaleString('vi-VN')} đ`))
      return
    }
    toast.info(
      t(
        'deposit.tpayQrPending',
        'Tạo mã QR Fastpay sẽ kết nối API cổng thanh toán. Hiện chỉ demo giao diện.',
      ),
    )
  }

  return (
    <div className="pages-deposit-method pages-deposit-method--tpay flex min-w-0 flex-col gap-4">
      {/* Header mobile */}
      <div className="pages-deposit-method__head flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <div className="text-sm font-black uppercase tracking-tight text-white">
          {t('deposit.tpayTab', 'QR Fastpay')}
        </div>
        <button
          type="button"
          className="rounded-lg px-2 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary underline-offset-2 transition-colors ease-out-expo hover:bg-white/5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          onClick={() =>
            toast.info(t('deposit.guideHint', 'Xem hướng dẫn nạp ở phần FAQ bên dưới.'))
          }
        >
          {t('deposit.guide', 'Hướng dẫn')}
        </button>
      </div>

      <form className="qrpay-form" onSubmit={handleSubmit}>
        {/* === Nhập số tiền === */}
        <div className="qrpay-form__input-money">
          <div className="form-input-money__container">
            <div className="form-input-money">
              <div className="form-input-money__header">
                <label className="form-input-money__label" htmlFor="tpay-amount">
                  {t('deposit.tpayAmountLabel', 'Số tiền nạp')}
                </label>
                <span className="form-input-money__unit">
                  {t('deposit.tpayEquivalent', 'Tương ứng')}{' '}
                  {vnd > 0 ? vnd.toLocaleString('vi-VN') : '0'} VNĐ
                </span>
              </div>
              {/* Input box */}
              <div className="relative mt-2 flex items-center overflow-hidden rounded-xl border border-fin-line bg-fin-deep transition-[border-color,box-shadow] duration-200 ease-out-expo focus-within:border-primary/50 focus-within:shadow-[0_0_0_1px_rgba(0,123,255,0.22)]">
                <input
                  id="tpay-amount"
                  placeholder={t('deposit.tpayAmountPlaceholder', 'Nhập số tiền nạp')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={9}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-text-muted"
                  value={amountRaw}
                  onChange={(e) => onInput(e.target.value)}
                  aria-describedby="tpay-amount-hint"
                />
                <span className="form-input-money__rate shrink-0 pr-4 text-sm font-black text-text-gray">K</span>
              </div>
              <p id="tpay-amount-hint" className="sr-only">
                {promotion ? t('deposit.tpayPromotionHint', 'Đang chọn gói khuyến mãi nạp.') : ''}
              </p>
              {/* Quick chips */}
              <div className="mt-3 v-sheet mx-auto qrpay-form__swiper-wrap" style={{ maxWidth: '100%' }}>
                <Swiper
                  modules={[FreeMode]}
                  spaceBetween={8}
                  slidesPerView="auto"
                  freeMode
                  className="swiper qrpay-form__swiper"
                  wrapperTag="div"
                >
                  {QUICK_K.filter(k => k >= minDepositK).map((k) => (
                    <SwiperSlide key={k} className="!w-auto" style={{ width: 'auto' }}>
                      <button
                        type="button"
                        className="qrpay-form__chip-btn"
                        onClick={() => setAmountRaw(String(k))}
                      >
                        {k.toLocaleString('en-US')} K
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
        </div>

        {/* === Gói khuyến mãi === */}
        <div className="qrpay-form__promotion">
          <div className="form-radio">
            <label className="form-radio__label" htmlFor="package_id_tpay">
              {t('deposit.cryptoPromoPackage', 'Gói khuyến mãi')}
            </label>
            <div className="form-radio__options">
              {PACKAGES.map((pkg) => {
                const sel = packageId === pkg.id
                return (
                  <label
                    key={pkg.id}
                    className={cn(
                      'form-radio-option',
                      sel && 'form-radio-option--selected',
                    )}
                  >
                    <input
                      id={pkg.id === '1' ? 'package_id_tpay' : `package-tpay-${pkg.id}`}
                      type="radio"
                      name="package_id_tpay"
                      className="form-radio-option__input sr-only"
                      value={pkg.id}
                      checked={sel}
                      onChange={() => setPackageId(pkg.id)}
                    />
                    <div className="form-radio-option__title">{pkg.title}</div>
                    <div className="form-radio-option__description">{pkg.description}</div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* === Lưu ý === */}
        <div className="qrpay-form__note">
          <div className="qrpay-form__note-label">{t('deposit.cryptoNoteTitle', 'Lưu ý')}</div>
          <ul className="qrpay-form__note-text">
            <li>
              {t('deposit.tpayNote1Prefix', 'Hệ thống cung cấp')}{' '}
              <span className="qrpay-form__note-text--highlight">
                {t('deposit.tpayNote1Highlight', 'ngân hàng ngẫu nhiên')}
              </span>{' '}
              {t(
                'deposit.tpayNote1Suffix',
                '(có thể khác ngân hàng), vui lòng dựa vào ngân hàng hiển thị trên mã QR để nạp tiền.',
              )}
            </li>
            <li>
              <span className="qrpay-form__note-text--highlight">
                {t('deposit.tpayNote2Highlight', 'Mã QR')}
              </span>{' '}
              {t(
                'deposit.tpayNote2Suffix',
                'chỉ cung cấp cho nạp tiền lần này. Vui lòng không lưu lại sử dụng cho những lần nạp tiền sau.',
              )}
            </li>
          </ul>
        </div>

        {/* === Nút submit === */}
        <div className="qrpay-form__footer">
          <button
            type="submit"
            className="btn-standard btn-primary w-full !py-3.5 rounded-2xl shadow-glow-primary active:scale-95"
            disabled={!amountValid}
            id="create-qr-code"
            name="create-qr-code"
            aria-label={t('deposit.tpayCreateQr', 'Tạo mã QR')}
          >
            {t('deposit.tpayCreateQr', 'Tạo mã QR')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DepositTpay
