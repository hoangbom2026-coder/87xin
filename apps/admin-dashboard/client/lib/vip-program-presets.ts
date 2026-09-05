import type { IVipProgramLevel } from "@/lib/vip-program-defaults";

/** Preset vận hành — áp lên bản sao mặc định dự án (chưa lưu DB cho đến khi bấm Lưu). */
export type VipPresetId = "project" | "conservative" | "balanced" | "generous";

export const VIP_PRESET_LABELS: Record<VipPresetId, string> = {
  project: "Mặc định dự án",
  conservative: "Bảo thủ — hạn mức thấp, phí cao hơn",
  balanced: "Cân bằng — giữ cấu trúc, tinh chỉnh nhẹ",
  generous: "Ưu đãi — hạn mức cao, phí thấp, bật quyền sớm hơn",
};

/** `balanced` ≈ project với làm tròn phí; `project` trả về clone chuẩn. */
export function applyVipPreset(
  projectDefaults: IVipProgramLevel[],
  id: VipPresetId,
): IVipProgramLevel[] {
  const base = projectDefaults.map((r) => ({ ...r }));

  if (id === "project") return base;

  if (id === "conservative") {
    return base.map((l) => ({
      ...l,
      maxWithdrawalUsd: Math.max(100, Math.round(l.maxWithdrawalUsd * 0.55)),
      withdrawalFeePercent: Math.min(5, Number((l.withdrawalFeePercent + 0.7).toFixed(2))),
      withdrawalsPerDay: Math.max(1, Math.floor(l.withdrawalsPerDay * 0.7)),
      inviteBonusUsd: Math.max(0, Number((l.inviteBonusUsd * 0.6).toFixed(2))),
      referralDepositFeePercent: Math.min(
        3,
        Number((l.referralDepositFeePercent + 0.25).toFixed(2)),
      ),
      bonusWheelMaxRewardUsd: Math.max(5, Math.round(l.bonusWheelMaxRewardUsd * 0.45)),
      personalGift: l.level >= 4,
      vipManager: l.level >= 6,
      priorityWithdrawal: l.level >= 5,
      birthdayGift: l.level >= 3,
    }));
  }

  if (id === "balanced") {
    return base.map((l) => ({
      ...l,
      withdrawalFeePercent: Number(l.withdrawalFeePercent.toFixed(2)),
      maxWithdrawalUsd: Math.round(l.maxWithdrawalUsd / 100) * 100,
    }));
  }

  /* generous */
  return base.map((l) => ({
    ...l,
    maxWithdrawalUsd: Math.round(l.maxWithdrawalUsd * 1.28),
    withdrawalFeePercent: Math.max(0, Number((l.withdrawalFeePercent - 0.35).toFixed(2))),
    withdrawalsPerDay: Math.min(15, l.withdrawalsPerDay + (l.level >= 3 ? 1 : 0)),
    inviteBonusUsd: Number((l.inviteBonusUsd * 1.4).toFixed(2)),
    referralDepositFeePercent: Math.max(
      0.2,
      Number((l.referralDepositFeePercent - 0.15).toFixed(2)),
    ),
    bonusWheelMaxRewardUsd: Math.round(l.bonusWheelMaxRewardUsd * 1.45),
    personalGift: l.level >= 2,
    birthdayGift: l.level >= 1,
    priorityWithdrawal: l.level >= 3,
    vipManager: l.level >= 4,
  }));
}
