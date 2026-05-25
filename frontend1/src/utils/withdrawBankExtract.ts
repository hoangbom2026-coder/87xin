import type { PlayerWithdrawRow } from '../services/playerService'

export type BankEntryFromWithdraw = {
  id: string
  bank: string
  holder: string
  accountNumber: string
  sourceWithdrawId: string
}

const str = (v: unknown) => (v == null ? '' : String(v).trim())

/**
 * Gom thông tin STK từ lịch sử rút (không có collection bank riêng trên backend hiện tại).
 * Hỗ trợ agpayment và object data kiểu bank chung.
 */
export function bankEntriesFromWithdrawHistory(rows: PlayerWithdrawRow[]): BankEntryFromWithdraw[] {
  const byKey = new Map<string, BankEntryFromWithdraw>()

  for (const w of rows || []) {
    const data = w?.data && typeof w.data === 'object' ? (w.data as Record<string, unknown>) : {}
    const payout = str(w.payoutType).toLowerCase()

    let bank = ''
    let holder = ''
    let accountNumber = ''

    if (payout === 'agpayment') {
      bank = str(data.userAccountType) || str(data.bankName) || str(data.bank) || 'AG Pay'
      holder = str(data.userName) || str(data.accountName) || str(data.holderName)
      accountNumber = str(data.userAccountNum) || str(data.accountNumber) || str(data.accountNo)
    } else {
      bank = str(data.bankName) || str(data.bank) || str(data.bankCode)
      holder = str(data.accountName) || str(data.holderName) || str(data.userName) || str(data.beneficiaryName)
      accountNumber =
        str(data.accountNumber) ||
        str(data.accountNo) ||
        str(data.userAccountNum) ||
        str(data.beneficiaryAccount)
    }

    if (!accountNumber && !holder) continue

    const key = `${bank}|${holder}|${accountNumber}`
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: key,
        bank: bank || '—',
        holder: holder || '—',
        accountNumber: accountNumber || '—',
        sourceWithdrawId: str(w._id),
      })
    }
  }

  return Array.from(byKey.values())
}
