import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import {
  Coins,
  Gift,
  Layers,
  Wallet,
  RefreshCw,
  Save,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  AffiliateMechanism,
  getAffiliateMechanism,
  updateAffiliateMechanism,
} from "@/lib/api";

const DEFAULT_FORM: AffiliateMechanism = {
  commission_rates: { slots_fishing: 0.3, others: 0.2, lottery: 0 },
  referral_bonus: {
    inviter_reward: 88,
    invitee_reward: 58,
    min_deposit: 1000,
    min_valid_bet: 3000,
  },
  multi_level_ratio: 10,
  withdrawal_condition: { turnover_x: 1, expiry_days: 30 },
};

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";

type NumberFieldProps = {
  label: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
  /** Áp dụng cho input `type=number` — true ⇒ chỉ integer, dùng cho ngày/vòng cược. */
  integer?: boolean;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm<AffiliateMechanism>>["register"]>;
  /** Phần phụ trợ (vd: `%` / `VND`) — render bám phải input. */
  suffix?: React.ReactNode;
};

function NumberField({
  label,
  hint,
  step = 0.01,
  min = 0,
  max,
  integer,
  error,
  register,
  suffix,
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : step}
          min={min}
          max={max}
          className={`h-10 pr-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          {...register}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        {description ? (
          <p className="pl-10 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function PreviewBox({
  multiLevelRatio,
  slotsFishingPct,
  inviterReward,
  inviteeReward,
}: {
  multiLevelRatio: number;
  slotsFishingPct: number;
  inviterReward: number;
  inviteeReward: number;
}) {
  const ratio = Math.max(0, Math.min(100, multiLevelRatio)) / 100;
  const f1Profit = 100_000;
  const f2Take = f1Profit * ratio;
  const f3Take = f2Take * ratio;

  const exampleBet = 1_000_000;
  const slotsRate = Math.max(0, slotsFishingPct) / 100;
  const f1FromSlots = exampleBet * slotsRate;

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" />
        Mô phỏng tác động (Preview)
      </div>
      <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/80">
        <li>
          Nếu F1 nhận <strong>{fmt(f1Profit)}</strong> hoa hồng → với tỷ lệ
          đa cấp <strong>{fmt(multiLevelRatio)}%</strong>, F2 nhận{" "}
          <strong className="text-primary">{fmt(f2Take)}</strong>, F3 nhận{" "}
          <strong className="text-primary">{fmt(f3Take)}</strong>.
        </li>
        <li>
          Người chơi cược <strong>{fmt(exampleBet)}</strong> Nổ hũ / Bắn cá → F1
          nhận hoa hồng{" "}
          <strong className="text-primary">{fmt(f1FromSlots)}</strong> (theo{" "}
          {fmt(slotsFishingPct)}%).
        </li>
        <li>
          Mỗi referee hợp lệ → người mời{" "}
          <strong className="text-primary">+{fmt(inviterReward)}</strong>, người
          mới <strong className="text-primary">+{fmt(inviteeReward)}</strong>{" "}
          (điểm thưởng).
        </li>
      </ul>
    </div>
  );
}

export default function AffiliateManagerAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AffiliateMechanism>({
    defaultValues: DEFAULT_FORM,
    mode: "onChange",
  });

  const watched = useWatch({ control });

  const load = async () => {
    setLoading(true);
    try {
      const token = getAdminToken() || "";
      const res = await getAffiliateMechanism(token);
      reset(res.value || DEFAULT_FORM);
    } catch (err) {
      toast({
        title: "Không tải được cấu hình",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = handleSubmit(async (form) => {
    setSaving(true);
    try {
      const token = getAdminToken() || "";
      const res = await updateAffiliateMechanism(token, form);
      reset(res.value);
      toast({
        title: "Đã áp dụng cấu hình",
        description: res.message || "Cập nhật cơ chế Affiliate thành công!",
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
  });

  const previewProps = useMemo(
    () => ({
      multiLevelRatio: Number(watched.multi_level_ratio ?? 0),
      slotsFishingPct: Number(watched.commission_rates?.slots_fishing ?? 0),
      inviterReward: Number(watched.referral_bonus?.inviter_reward ?? 0),
      inviteeReward: Number(watched.referral_bonus?.invitee_reward ?? 0),
    }),
    [watched],
  );

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Cơ chế Affiliate (Dynamic Config)"
        description="Cấu hình tỷ lệ hoa hồng, thưởng mời bạn, đa cấp và điều kiện rút thưởng. Áp dụng ngay sau khi lưu — hệ thống sẽ dùng giá trị mới cho lần tính kế tiếp."
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
              onClick={onSubmit}
              disabled={loading || saving || !isDirty}
              title={!isDirty ? "Không có thay đổi" : undefined}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Đang lưu..." : "Áp dụng ngay"}
            </Button>
          </>
        }
      />

      <form className="grid gap-5" onSubmit={onSubmit}>
        <PreviewBox {...previewProps} />

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            icon={Coins}
            title="A. Tỷ lệ hoa hồng theo sảnh"
            description="% commission tính trên tổng cược hợp lệ của F1. Phạm vi 0–100, bước 0.01."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NumberField
                label="Nổ hũ / Bắn cá"
                hint="Slots & Fishing"
                max={100}
                suffix="%"
                error={errors.commission_rates?.slots_fishing?.message}
                register={register("commission_rates.slots_fishing", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                  max: { value: 100, message: "≤ 100" },
                })}
              />
              <NumberField
                label="Sản phẩm khác"
                hint="Thể thao, Casino..."
                max={100}
                suffix="%"
                error={errors.commission_rates?.others?.message}
                register={register("commission_rates.others", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                  max: { value: 100, message: "≤ 100" },
                })}
              />
              <NumberField
                label="Xổ số"
                hint="Lottery"
                max={100}
                suffix="%"
                error={errors.commission_rates?.lottery?.message}
                register={register("commission_rates.lottery", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                  max: { value: 100, message: "≤ 100" },
                })}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Layers}
            title="C. Đa cấp (MLM)"
            description="Tỷ lệ hưởng từ tầng dưới. Vd 10% → F2 nhận 10% của F1, F3 nhận 10% của F2."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="multi_level_ratio"
                rules={{
                  required: "Bắt buộc",
                  min: { value: 0, message: "≥ 0" },
                  max: { value: 100, message: "≤ 100" },
                }}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Tỷ lệ kế thừa tầng
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        max={100}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className={`h-10 pr-10 ${fieldState.error ? "border-destructive" : ""}`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                    {fieldState.error ? (
                      <p className="text-[11px] font-medium text-destructive">
                        {fieldState.error.message}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Cấp số nhân theo từng tầng: F2 = F1×r, F3 = F1×r².
                      </p>
                    )}
                  </div>
                )}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Công thức áp dụng
                </Label>
                <div className="flex h-10 items-center rounded-md border border-dashed border-border bg-muted/30 px-3 font-mono text-[11px] text-muted-foreground">
                  bonus = bet × rate × ratio^level
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Áp cho mọi sảnh khi tính hoa hồng tầng dưới.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Gift}
            title="B. Thưởng mời bạn"
            description="Số điểm thưởng + điều kiện để referee được tính là 'Thành viên hợp lệ'."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                label="Thưởng người mời (inviter)"
                step={1}
                integer
                error={errors.referral_bonus?.inviter_reward?.message}
                register={register("referral_bonus.inviter_reward", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                })}
              />
              <NumberField
                label="Thưởng người mới (invitee)"
                step={1}
                integer
                error={errors.referral_bonus?.invitee_reward?.message}
                register={register("referral_bonus.invitee_reward", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                })}
              />
              <NumberField
                label="Nạp tối thiểu (hợp lệ)"
                hint="VND / điểm"
                step={1000}
                integer
                error={errors.referral_bonus?.min_deposit?.message}
                register={register("referral_bonus.min_deposit", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                })}
              />
              <NumberField
                label="Cược hợp lệ tối thiểu"
                hint="Turnover yêu cầu"
                step={1000}
                integer
                error={errors.referral_bonus?.min_valid_bet?.message}
                register={register("referral_bonus.min_valid_bet", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 0, message: "≥ 0" },
                })}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Wallet}
            title="D. Điều kiện rút thưởng"
            description="Vòng cược yêu cầu trước khi thưởng có thể rút + thời hạn còn hiệu lực."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                label="Vòng cược (turnover x)"
                hint="≥ 1 lần"
                step={1}
                integer
                min={1}
                error={errors.withdrawal_condition?.turnover_x?.message}
                register={register("withdrawal_condition.turnover_x", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 1, message: "≥ 1" },
                })}
              />
              <NumberField
                label="Thời hạn nhận thưởng"
                hint="Số ngày"
                step={1}
                integer
                min={1}
                suffix="ngày"
                error={errors.withdrawal_condition?.expiry_days?.message}
                register={register("withdrawal_condition.expiry_days", {
                  required: "Bắt buộc",
                  valueAsNumber: true,
                  min: { value: 1, message: "≥ 1" },
                })}
              />
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 sm:flex-row sm:items-start">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Lưu ý</p>
            <p className="mt-0.5 opacity-90">
              Mọi thay đổi sẽ được ghi vào{" "}
              <code className="rounded bg-amber-500/15 px-1 py-0.5">admin_audit_logs</code>{" "}
              và cache config (TTL 60s) sẽ bị bust ngay khi bấm <em>Áp dụng ngay</em>. Các
              lần tính hoa hồng/ thưởng kế tiếp sẽ dùng giá trị mới.
            </p>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
