import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  RefreshCw,
  Save,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Coins,
  Wallet,
  Calendar,
} from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  VipTier,
  getVipTiersConfig,
  updateVipTiersConfig,
} from "@/lib/api";

/** Một số preset gradient (đồng bộ palette với trang VIP frontend1). */
const COLOR_PRESETS = [
  "#d97706", "#10b981", "#3b82f6", "#f43f5e", "#7c3aed",
  "#ec4899", "#a855f7", "#dc2626", "#f59e0b", "#ef4444",
];

type FieldDef = {
  key: keyof VipTier;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  /** Hiển thị % suffix */
  pct?: boolean;
  /** Format VND */
  vnd?: boolean;
  /** Step input number */
  step?: number;
  /** Min/Max */
  min?: number;
  max?: number;
};

const FIELDS: FieldDef[] = [
  { key: "minValidBet",     label: "Cược hợp lệ",   icon: TrendingUp, vnd: true,  step: 1_000_000, min: 0 },
  { key: "upReward",        label: "Thưởng lên cấp", icon: Coins,     vnd: true,  step: 10_000,    min: 0 },
  { key: "cashbackRate",    label: "Hoàn tiền %",    icon: Coins,     pct: true,  step: 0.05,      min: 0, max: 100 },
  { key: "lossReturnRate",  label: "Hoàn tổn thất %",icon: Wallet,    pct: true,  step: 0.5,       min: 0, max: 100 },
  { key: "lossReturnMax",   label: "Hoàn tổn thất max", icon: Wallet, vnd: true,  step: 100_000,   min: 0 },
  { key: "fridayBonusRate", label: "Thưởng T6 %",    icon: Calendar,  pct: true,  step: 0.5,       min: 0, max: 100 },
  { key: "fridayBonusMax",  label: "Thưởng T6 max",  icon: Calendar,  vnd: true,  step: 100_000,   min: 0 },
];

const fmtVnd = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-US") : "—";

const fmtShort = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })} triệu`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("en-US", { maximumFractionDigits: 0 })} K`;
  return String(n);
};

function NumCell({
  value,
  onChange,
  step,
  min,
  max,
  pct,
  vnd,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  pct?: boolean;
  vnd?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 pr-9 text-right text-xs"
      />
      {(pct || vnd) && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] font-medium text-muted-foreground">
          {pct ? "%" : "₫"}
        </span>
      )}
    </div>
  );
}

export default function VipTiersManagerAdmin() {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [original, setOriginal] = useState<VipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultsRef, setDefaultsRef] = useState<VipTier[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const token = getAdminToken() || "";
      const res = await getVipTiersConfig(token);
      setTiers(res.value);
      setOriginal(JSON.parse(JSON.stringify(res.value)));
      setDefaultsRef(res.defaults || []);
    } catch (err) {
      toast({
        title: "Không tải được cấu hình VIP",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(tiers) !== JSON.stringify(original),
    [tiers, original],
  );

  const setField = <K extends keyof VipTier>(
    level: number,
    key: K,
    value: VipTier[K],
  ) => {
    setTiers((prev) =>
      prev.map((t) => (t.level === level ? { ...t, [key]: value } : t)),
    );
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const token = getAdminToken() || "";
      const res = await updateVipTiersConfig(token, tiers);
      setTiers(res.value);
      setOriginal(JSON.parse(JSON.stringify(res.value)));
      toast({
        title: "Đã áp dụng cấu hình VIP",
        description: res.message || "Cập nhật thành công!",
      });
    } catch (err) {
      toast({
        title: "Lỗi khi lưu",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onResetRow = (level: number) => {
    const def = defaultsRef.find((t) => t.level === level);
    if (!def) return;
    setTiers((prev) => prev.map((t) => (t.level === level ? { ...def } : t)));
  };

  /** Tăng dần — đảm bảo cược cấp dưới < cấp trên. Cảnh báo (không chặn) nếu lệch. */
  const monotonicWarnings = useMemo(() => {
    const sorted = [...tiers].sort((a, b) => a.level - b.level);
    const warns: string[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1];
      const b = sorted[i];
      if (b.minValidBet > 0 && a.minValidBet > 0 && b.minValidBet < a.minValidBet) {
        warns.push(`${b.name}: cược (${fmtShort(b.minValidBet)}) thấp hơn ${a.name} (${fmtShort(a.minValidBet)})`);
      }
    }
    return warns;
  }, [tiers]);

  /** Stats nhanh: tổng ngân sách thưởng lên cấp + max payouts. */
  const summary = useMemo(() => {
    const totalUpReward = tiers.reduce((s, t) => s + (Number(t.upReward) || 0), 0);
    const totalLossMax = tiers.reduce((s, t) => s + (Number(t.lossReturnMax) || 0), 0);
    const totalFridayMax = tiers.reduce((s, t) => s + (Number(t.fridayBonusMax) || 0), 0);
    return { totalUpReward, totalLossMax, totalFridayMax };
  }, [tiers]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Cơ chế VIP (Dynamic Config)"
        description="Chỉnh mốc cược / thưởng / hoàn trả của 10 cấp VIP. Áp dụng ngay sau khi lưu — trang VIP web user tự cập nhật."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading || saving}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Tải lại
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={loading || saving || !isDirty}
              title={!isDirty ? "Không có thay đổi" : undefined}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Đang lưu..." : "Áp dụng ngay"}
            </Button>
          </>
        }
      />

      {/* Summary */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Coins className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Tổng thưởng lên cấp (10 cấp)</p>
              <p className="text-sm font-semibold">{fmtVnd(summary.totalUpReward)} ₫</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-rose-500/10 text-rose-500">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Hoàn tổn thất max (cộng dồn)</p>
              <p className="text-sm font-semibold">{fmtVnd(summary.totalLossMax)} ₫</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Thưởng nạp T6 max (cộng dồn)</p>
              <p className="text-sm font-semibold">{fmtVnd(summary.totalFridayMax)} ₫</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {monotonicWarnings.length > 0 && (
        <div className="mb-5 flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Mốc cược không tăng dần</p>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
              {monotonicWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Crown className="h-4 w-4" />
            </span>
            Bảng cấu hình 10 cấp VIP
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1280px] border-collapse text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 z-10 w-[140px] bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground">
                  Cấp / Tên
                </th>
                {FIELDS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <th
                      key={String(f.key)}
                      className="min-w-[130px] px-2 py-2 text-left font-medium text-muted-foreground"
                    >
                      <span className="flex items-center gap-1">
                        {Icon ? <Icon size={12} /> : null}
                        {f.label}
                      </span>
                    </th>
                  );
                })}
                <th className="w-[90px] px-2 py-2 text-center font-medium text-muted-foreground">
                  Màu
                </th>
                <th className="w-[60px] px-2 py-2 text-center font-medium text-muted-foreground">
                  Reset
                </th>
              </tr>
            </thead>
            <tbody>
              {tiers
                .slice()
                .sort((a, b) => a.level - b.level)
                .map((t) => (
                  <tr
                    key={t.level}
                    className="border-t border-border/60 hover:bg-muted/20"
                  >
                    <td className="sticky left-0 z-10 bg-card px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white shadow-sm"
                          style={{ background: t.colorCode }}
                        >
                          {t.level}
                        </span>
                        <Input
                          value={t.name}
                          onChange={(e) =>
                            setField(t.level, "name", e.target.value)
                          }
                          className="h-8 w-[80px] text-xs"
                        />
                      </div>
                    </td>
                    {FIELDS.map((f) => (
                      <td key={String(f.key)} className="px-2 py-2">
                        <NumCell
                          value={Number(t[f.key] ?? 0)}
                          onChange={(v) => setField(t.level, f.key, v as never)}
                          step={f.step}
                          min={f.min}
                          max={f.max}
                          pct={f.pct}
                          vnd={f.vnd}
                        />
                        {f.vnd && (
                          <p className="mt-0.5 pr-1 text-right text-[10px] text-muted-foreground">
                            {fmtShort(Number(t[f.key] ?? 0))}
                          </p>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={t.colorCode || "#888888"}
                          onChange={(e) =>
                            setField(t.level, "colorCode", e.target.value)
                          }
                          className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
                          title={t.colorCode}
                        />
                        <select
                          className="h-8 rounded border border-border bg-transparent px-1 text-[10px]"
                          value={
                            COLOR_PRESETS.includes(t.colorCode)
                              ? t.colorCode
                              : ""
                          }
                          onChange={(e) =>
                            e.target.value &&
                            setField(t.level, "colorCode", e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {COLOR_PRESETS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onResetRow(t.level)}
                        title="Khôi phục mặc định"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Mọi thay đổi sẽ được ghi vào <code className="rounded bg-muted px-1">admin_audit_logs</code>.
        Cache <code className="rounded bg-muted px-1">vip-tiers</code> (TTL 60s) bị bust ngay khi nhấn{" "}
        <em>Áp dụng ngay</em>.
      </p>
    </AdminLayout>
  );
}
