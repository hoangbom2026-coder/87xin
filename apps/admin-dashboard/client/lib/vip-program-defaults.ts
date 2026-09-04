/**
 * Phải khớp logic `backend/src/main/constants/vip-program-defaults.ts`
 * (admin bundle không import backend). Chỉnh song song khi đổi mặc định dự án.
 */

export interface IVipProgramLevel {
  level: number;
  name: string;
  player: string;
  xpThreshold: number;
  badgeIcon?: string;
  personalGift: boolean;
  vipManager: boolean;
  priorityWithdrawal: boolean;
  birthdayGift: boolean;
  withdrawalsPerDay: number;
  maxWithdrawalUsd: number;
  withdrawalFeePercent: number;
  inviteBonusUsd: number;
  referralDepositFeePercent: number;
  bonusWheelMaxRewardUsd: number;
}

const LEVEL_NAMES = [
  "Cấp 0 — Khởi đầu",
  "Đồng",
  "Bạc",
  "Vàng",
  "Bạch kim",
  "Kim cương",
  "Elite",
  "Prestige",
  "VIP Đối tác",
];

const WITHDRAWALS_PER_DAY = [1, 1, 2, 2, 3, 4, 5, 6, 8];
const MAX_WD_USD = [400, 800, 2000, 4500, 9000, 15000, 28000, 45000, 80000];
const WD_FEE_PCT = [3.2, 2.8, 2.5, 2.2, 1.8, 1.5, 1.2, 0.9, 0.5];
const INVITE_USD = [0.5, 1, 2, 4, 6, 10, 15, 25, 40];
const REF_DEPOSIT_FEE_PCT = [1.5, 1.3, 1.1, 1, 0.85, 0.75, 0.65, 0.55, 0.45];
const WHEEL_MAX_USD = [8, 15, 35, 75, 150, 300, 500, 800, 1500];

const XP_THRESHOLDS = [0, 5_000, 25_000, 85_000, 220_000, 520_000, 1_200_000, 3_000_000, 8_000_000];

function levelRow(level: number): IVipProgramLevel {
  const personalGift = level >= 3;
  const vipManager = level >= 5;
  const priorityWithdrawal = level >= 4;
  const birthdayGift = level >= 2;

  return {
    level,
    name: LEVEL_NAMES[level] ?? `Cấp ${level}`,
    player: "Thành viên",
    xpThreshold: XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1],
    personalGift,
    vipManager,
    priorityWithdrawal,
    birthdayGift,
    withdrawalsPerDay: WITHDRAWALS_PER_DAY[level] ?? 1,
    maxWithdrawalUsd: MAX_WD_USD[level] ?? 500,
    withdrawalFeePercent: WD_FEE_PCT[level] ?? 2.5,
    inviteBonusUsd: INVITE_USD[level] ?? 1,
    referralDepositFeePercent: REF_DEPOSIT_FEE_PCT[level] ?? 1,
    bonusWheelMaxRewardUsd: WHEEL_MAX_USD[level] ?? 10,
  };
}

export const DEFAULT_VIP_PROGRAM_LEVELS: IVipProgramLevel[] = Array.from({ length: 9 }, (_, i) =>
  levelRow(i),
);

export function mergeVipProgramLevels(stored?: IVipProgramLevel[] | null): IVipProgramLevel[] {
  const map = new Map<number, IVipProgramLevel>();
  for (const d of DEFAULT_VIP_PROGRAM_LEVELS) {
    map.set(d.level, { ...d });
  }
  if (stored?.length) {
    for (const s of stored) {
      if (s.level < 0 || s.level > 8) continue;
      const base = map.get(s.level);
      if (!base) continue;
      map.set(s.level, { ...base, ...s, level: s.level });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.level - b.level);
}
