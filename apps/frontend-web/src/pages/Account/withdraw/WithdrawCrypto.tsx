import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Loader } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useSite } from '../../../hooks/useSite'
import ModalAddCryptoWallet, {
  type SavedCryptoWalletPayload,
} from '../../../components/financial/ModalAddCryptoWallet'
import { CRYPTO_NETWORKS, DEPOSIT_CRYPTO_NETWORKS } from '../../../constants/financial'
import { cn } from '../../../lib/cn'
import { ACCOUNT_VIEW_FADE_CLASS } from '../../../constants/pageShell'
import { toast } from '../../../utils/toast'

const STORAGE_KEY = 'account_crypto_wallets_v1'
const TRC20_ID = 'usdt_trc20'
const QUICK_K = [100, 500, 1000, 5000, 50000] as const

interface StoredCryptoWallet {
  id: string
  networkId: string
  networkName: string
  address: string
}

function loadWallets(): StoredCryptoWallet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (w): w is StoredCryptoWallet =>
        typeof w === 'object' &&
        w !== null &&
        typeof (w as StoredCryptoWallet).id === 'string' &&
        typeof (w as StoredCryptoWallet).address === 'string' &&
        typeof (w as StoredCryptoWallet).networkId === 'string',
    )
  } catch {
    return []
  }
}

function maskAddr(addr: string) {
  const a = addr.trim()
  if (a.length <= 12) return a
  return `${a.slice(0, 6)}…${a.slice(-6)}`
}

/** VND / 1 USDT — lấy từ `CRYPTO_NETWORKS`. */
function vndPerUsdt(): number {
  const row = CRYPTO_NETWORKS.find((n) => n.id === TRC20_ID) ?? CRYPTO_NETWORKS[0]
  const n = parseInt(String(row?.rate ?? '26523').replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 26523
}

/**
 * Rút Crypto (USDT TRC20).
 */
const WithdrawCrypto: React.FC = () => {
  const { t } = useLanguage()
  const { siteData } = useSite()
  const [wallets, setWallets] = useState<StoredCryptoWallet[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amountRaw, setAmountRaw] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const minCryptoWithdrawVnd = siteData?.site?.transactionLimits?.minCryptoWithdraw || 100000;
  const maxCryptoWithdrawVnd = siteData?.site?.transactionLimits?.maxCryptoWithdraw || 500000000;
  const minCryptoWithdrawK = minCryptoWithdrawVnd / 1000;
  const maxCryptoWithdrawK = maxCryptoWithdrawVnd / 1000;

  const refresh = useCallback(() => setWallets(loadWallets()), [])
  useEffect(() => { refresh() }, [refresh])

  const trcWallets = useMemo(
    () => wallets.filter((w) => w.networkId === TRC20_ID),
    [wallets],
  )

  useEffect(() => {
    if (!trcWallets.length) {
      setSelectedId(null)
      return
    }
    setSelectedId((prev) =>
      prev && trcWallets.some((w) => w.id === prev) ? prev : trcWallets[0]!.id,
    )
  }, [trcWallets])

  const existingKeys = useMemo(() => {
    const s = new Set<string>()
    for (const w of wallets) s.add(`${w.networkId}:${w.address.toLowerCase()}`)
    return s
  }, [wallets])

  const onSaved = (p: SavedCryptoWalletPayload) => {
    const row: StoredCryptoWallet = {
      id: `cw-${Date.now()}`,
      networkId: p.networkId,
      networkName: p.networkName,
      address: p.address,
    }
    const next = [row, ...wallets]
    setWallets(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const iconFor = (networkId: string) =>
    CRYPTO_NETWORKS.find((n) => n.id === networkId)?.icon ?? '/images/icons/pages/account/icon-usdt.webp'

  const rateLine =
    DEPOSIT_CRYPTO_NETWORKS.find((n) => n.id === 'TRC20')?.rateLine ?? '1 USDT = 26,385 VNĐ'
  const rateNum = vndPerUsdt()

  const kNum = useMemo(() => {
    const d = amountRaw.replace(/\D/g, '').slice(0, 9)
    if (!d) return NaN
    return Math.floor(Number(d))
  }, [amountRaw])

  const usdt = useMemo(() => {
    if (!Number.isFinite(kNum) || kNum <= 0) return 0
    return (kNum * 1000) / rateNum
  }, [kNum, rateNum])

  const hasTrc = trcWallets.length > 0
  const amountOk = Number.isFinite(kNum) && kNum >= minCryptoWithdrawK && kNum <= maxCryptoWithdrawK

  const onAmountInput = (v: string) => {
    setAmountRaw(v.replace(/\D/g, '').slice(0, 9))
  }

  const [submitting, setSubmitting] = useState(false)
  
  const onSubmitAmount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasTrc || !amountOk || !selectedId) {
      toast.error(t('common.invalidAmount', `Số tiền phải từ ${minCryptoWithdrawK.toLocaleString('vi-VN')} K đến ${maxCryptoWithdrawK.toLocaleString('vi-VN')} K`))
      return
    }
    
    const selectedWallet = trcWallets.find(w => w.id === selectedId)
    if (!selectedWallet) return
    
    setSubmitting(true)
    try {
      const { createWithdrawRequest } = await import('../../../services/withdrawService')
      const res = await createWithdrawRequest({
        amount: kNum * 1000, // convert k to full amount
        currency: 'VND', // or get from user state
        payoutType: 'nowpayment', // typical for crypto in this system
        data: {
          network: selectedWallet.networkId,
          address: selectedWallet.address,
        },
      })
      if (res.success) {
        toast.success(t('withdrawal.success', 'Đã gửi yêu cầu rút tiền.'))
        setAmountRaw('')
      } else {
        toast.error(res.message || t('withdrawal.failed', 'Rút tiền thất bại'))
      }
    } catch (error: any) {
      toast.error(error.message || t('withdrawal.failed', 'Rút tiền thất bại'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn('withdraw-crypto-page flex flex-col gap-5', ACCOUNT_VIEW_FADE_CLASS)}>
      {/* Header mobile */}
      <div className="withdraw-crypto-page__head lg:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-black uppercase tracking-tight text-white">
            {t('withdrawal.cryptoMenu', 'Crypto')}
          </div>
          <button
            type="button"
            className="text-[11px] font-black uppercase tracking-widest text-primary underline-offset-2 hover:underline"
            onClick={() =>
              toast.info(t('withdrawal.cryptoGuideHint', 'Xem FAQ rút tiền ở cột bên phải hoặc liên hệ CSKH.'))
            }
          >
            {t('withdrawal.cryptoToolbarGuide', 'Hướng dẫn')}
          </button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="rounded-2xl border border-fin-line bg-fin-deep/85 p-4 sm:p-5">
        <h3 className="mb-3 text-[12px] font-black uppercase tracking-widest text-primary">
          {t('withdrawal.cryptoGuideTitle', 'Hướng dẫn USDT (TRC20)')}
        </h3>
        <ul className="space-y-1.5 pl-4 text-[13px] leading-relaxed text-text-muted [list-style:disc]">
          <li>{t('withdrawal.cryptoGuide1', 'Vui lòng dùng địa chỉ ví USDT trên mạng TRC20.')}</li>
          <li>{t('withdrawal.cryptoGuide2', 'Tỷ giá quy đổi áp dụng tại thời điểm rút thành công.')}</li>
          <li>{t('withdrawal.cryptoGuide3', 'Mỗi giao dịch rút có thể mất 10–30 phút xử lý.')}</li>
          <li>{t('withdrawal.cryptoGuide4', 'Đảm bảo địa chỉ ví chính xác, sai địa chỉ không thể hoàn lại.')}</li>
        </ul>
      </div>

      {/* Danh sách ví */}
      <div className="flex flex-col gap-4">
        {!hasTrc ? (
          <div
            className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 text-[12px] font-medium leading-relaxed text-amber-100/95"
            role="status"
          >
            {t('withdrawal.cryptoNeedTrc20', 'Bạn cần thêm địa chỉ ví USDT-TRC20 để rút tiền.')}
          </div>
        ) : null}

        {hasTrc ? (
          <ul className="space-y-2">
            {trcWallets.map((w) => {
              const sel = selectedId === w.id
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(w.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                      sel
                        ? 'border-primary bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]'
                        : 'border-fin-line bg-[#111723]/75 hover:border-primary/35',
                    )}
                  >
                    <img
                      src={iconFor(w.networkId)}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-md bg-white/5 object-contain p-1"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.opacity = '0.4' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-gray">
                        {w.networkName}
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">
                        {maskAddr(w.address)}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#2a3447] bg-fin-deep/60 px-4 py-6 text-center">
            <img
              src="/images/icons/pages/account/icon-usdt.webp"
              alt=""
              aria-hidden
              width={48}
              height={48}
              className="mx-auto h-12 w-12 object-contain opacity-90"
            />
            <p className="mt-2 text-[13px] font-semibold text-text-muted">
              {t('withdrawal.cryptoWalletEmpty', 'Vui lòng thêm địa chỉ ví của bạn')}
            </p>
          </div>
        )}

        {/* Nút thêm ví */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          id="add-crypto-wallet"
          name="add-crypto-wallet"
          aria-label={t('withdrawal.addWallet', 'Thêm ví')}
          className="btn-standard btn-primary w-full !py-3.5 rounded-2xl shadow-glow-primary active:scale-95 inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden />
          {t('withdrawal.addWallet', 'Thêm ví')}
        </button>
      </div>

      {/* Form nhập số tiền */}
      <form
        className="withdraw-crypto-form qrpay-form flex flex-col gap-4"
        onSubmit={onSubmitAmount}
      >
        <div className="qrpay-form__input-money">
          <div className="form-input-money__container">
            <div className={cn('form-input-money', !hasTrc && 'pointer-events-none opacity-45')}>
              <div className="form-input-money__header">
                <label className="form-input-money__label" htmlFor="withdraw-crypto-k">
                  {t('withdrawal.cryptoWithdrawPoints', 'Số điểm rút')}
                </label>
                <span className="form-input-money__unit">
                  {t('withdrawal.cryptoEquivUsdt', 'Tương ứng')}{' '}
                  {usdt > 0 ? usdt.toFixed(2) : '0'} USDT
                </span>
              </div>
              {/* Input box */}
              <div className="relative mt-2 flex items-center overflow-hidden rounded-xl border border-fin-line bg-fin-deep focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                <input
                  id="withdraw-crypto-k"
                  placeholder={t('withdrawal.enterAmountK', 'Nhập số tiền (K)...')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={9}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-text-muted disabled:opacity-50"
                  value={amountRaw}
                  onChange={(e) => onAmountInput(e.target.value)}
                  disabled={!hasTrc}
                />
                <span className="form-input-money__rate shrink-0 pr-4 text-sm font-black text-text-gray">K</span>
              </div>
              {/* Quick chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_K.map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={!hasTrc}
                    className="qrpay-form__chip-btn disabled:pointer-events-none disabled:opacity-40"
                    onClick={() => setAmountRaw(String(k))}
                  >
                    {k.toLocaleString('vi-VN')} K
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lưu ý tỷ giá */}
        <div className="rounded-xl border border-fin-line/90 bg-fin-deep/80 px-3 py-3 sm:px-4">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-text-gray">
            {t('withdrawal.cryptoNotesHeading', 'Lưu ý')}
          </div>
          <ul className="space-y-1.5 text-[12px] leading-relaxed text-text-muted">
            <li>
              <span className="font-bold text-white/90">{t('withdrawal.cryptoFeeLabel', 'Phí')}: </span>
              {t('withdrawal.cryptoFeeValue', 'Theo cổng thanh toán / chưa áp dụng demo')}
            </li>
            <li>
              <span className="font-bold text-white/90">{t('withdrawal.cryptoRateLabel', 'Tỷ giá tham khảo hiện tại')}: </span>
              {rateLine}
            </li>
          </ul>
        </div>

        {/* Nút submit */}
        <button
          type="submit"
          disabled={!hasTrc || !amountOk || submitting}
          className={cn(
            'btn-standard btn-primary w-full !py-3.5 rounded-2xl shadow-glow-primary active:scale-95 inline-flex items-center justify-center gap-2',
            (!hasTrc || !amountOk || submitting) && 'pointer-events-none opacity-50 shadow-none',
          )}
        >
          {submitting && <Loader size={16} className="animate-spin" aria-hidden />}
          {t('common.withdraw', 'Rút')}
        </button>
      </form>

      <ModalAddCryptoWallet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existingAddressKeys={existingKeys}
        onSaved={onSaved}
      />
    </div>
  )
}

export default WithdrawCrypto
