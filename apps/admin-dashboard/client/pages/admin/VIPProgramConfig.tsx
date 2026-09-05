import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminRelatedLinks from "@/components/admin/AdminRelatedLinks";
import { Button } from "@game/ui/button";
import { Card, CardContent } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { ScrollArea } from "@game/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@game/ui/select";
import { Switch } from "@game/ui/switch";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import {
  DEFAULT_VIP_PROGRAM_LEVELS,
  mergeVipProgramLevels,
  type IVipProgramLevel,
} from "@/lib/vip-program-defaults";
import {
  applyVipPreset,
  VIP_PRESET_LABELS,
  type VipPresetId,
} from "@/lib/vip-program-presets";
import * as React from "react";
import { RefreshCw, RotateCcw, Save } from "lucide-react";

const tk = () => getAdminToken() || "";

function patchLevel(
  rows: IVipProgramLevel[],
  level: number,
  patch: Partial<IVipProgramLevel>,
): IVipProgramLevel[] {
  return rows.map((r) => (r.level === level ? { ...r, ...patch, level } : r));
}

export default function VIPProgramConfig() {
  const [rows, setRows] = React.useState<IVipProgramLevel[]>(() =>
    mergeVipProgramLevels(null),
  );
  const [preset, setPreset] = React.useState<VipPresetId>("project");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [selectedLevel, setSelectedLevel] = React.useState(0);

  async function load() {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const doc = (await getBusinessSettings(t)) as {
        vipProgramLevels?: IVipProgramLevel[];
      };
      setRows(
        mergeVipProgramLevels(doc.vipProgramLevels ?? null),
      );
    } catch (e: unknown) {
      toast({
        title: "Không tải được cấu hình VIP",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function save() {
    const t = tk();
    if (!t) return;
    setSaving(true);
    try {
      const res = (await patchBusinessSettings(
        { vipProgramLevels: rows },
        t,
      )) as { vipProgramLevels?: IVipProgramLevel[] };
      setRows(mergeVipProgramLevels(res.vipProgramLevels ?? null));
      toast({ title: "Đã lưu cấu hình VIP (Level 0–8)" });
    } catch (e: unknown) {
      toast({
        title: "Lưu thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function resetToProjectDefaults() {
    setRows(mergeVipProgramLevels(null));
    setPreset("project");
    toast({
      title: "Đã khôi phục mặc định dự án",
      description: "Chưa ghi DB — bấm Lưu để áp production.",
    });
  }

  function onPresetChange(id: VipPresetId) {
    setPreset(id);
    setRows(applyVipPreset(DEFAULT_VIP_PROGRAM_LEVELS, id));
    toast({
      title: `Đã áp: ${VIP_PRESET_LABELS[id]}`,
      description: "Kiểm tra bảng rồi Lưu để ghi MongoDB.",
    });
  }

  const head =
    "sticky left-0 z-10 min-w-[72px] bg-card px-2 py-2 text-left text-xs font-medium text-muted-foreground border-r";

  const activeRow = React.useMemo(
    () =>
      rows.find((r) => r.level === selectedLevel) ||
      rows[0] ||
      mergeVipProgramLevels(null)[0],
    [rows, selectedLevel],
  );

  function updateActive(patch: Partial<IVipProgramLevel>) {
    setRows((prev) => patchLevel(prev, activeRow.level, patch));
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6">
        <AdminPageHeader
          title="Cấu hình VIP (Level 0 – 8)"
          description="Giá trị gốc: hạn mức rút, phí, quà, checkbox CS. Hai cột Ngưỡng XP và URL badge map sang trang VIP (thanh tier + icon). Người chơi nhận GET /api/setting/site → vipProgram.levels."
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading || saving}
            >
              <RefreshCw className="mr-2 size-4" />
              {loading ? "Đang tải…" : "Tải từ DB"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetToProjectDefaults}
              disabled={saving}
            >
              <RotateCcw className="mr-2 size-4" />
              Mặc định gốc
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              <Save className="mr-2 size-4" />
              {saving ? "Đang lưu…" : "Lưu vào DB"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Preset nhanh:</span>
            <Select
              value={preset}
              onValueChange={(v) => onPresetChange(v as VipPresetId)}
            >
              <SelectTrigger className="h-9 w-[min(100vw-2rem,280px)]">
                <SelectValue placeholder="Chọn preset" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VIP_PRESET_LABELS) as VipPresetId[]).map((id) => (
                  <SelectItem key={id} value={id}>
                    {VIP_PRESET_LABELS[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardContent className="p-0">
              <ScrollArea className="h-[580px]">
                <div className="p-3 space-y-2">
                  {rows.map((r) => (
                    <button
                      key={r.level}
                      type="button"
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                        selectedLevel === r.level
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/40"
                      }`}
                      onClick={() => setSelectedLevel(r.level)}
                    >
                      Level {r.level}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-lg font-semibold">VIP - Level {activeRow.level}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={activeRow.name}
                    placeholder="Name"
                    onChange={(e) => updateActive({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Player</Label>
                  <Input
                    value={activeRow.player}
                    placeholder="Player"
                    onChange={(e) => updateActive({ player: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ngưỡng XP</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={activeRow.xpThreshold}
                    onChange={(e) =>
                      updateActive({ xpThreshold: Math.max(0, Number(e.target.value || 0)) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Badge URL</Label>
                  <Input
                    placeholder="/assets/... hoặc https://..."
                    value={activeRow.badgeIcon ?? ""}
                    onChange={(e) => updateActive({ badgeIcon: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Personal gift</span>
                  <Switch
                    checked={activeRow.personalGift}
                    onCheckedChange={(v) => updateActive({ personalGift: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">VIP manager</span>
                  <Switch
                    checked={activeRow.vipManager}
                    onCheckedChange={(v) => updateActive({ vipManager: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Priority withdrawal</span>
                  <Switch
                    checked={activeRow.priorityWithdrawal}
                    onCheckedChange={(v) => updateActive({ priorityWithdrawal: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Birthday gift</span>
                  <Switch
                    checked={activeRow.birthdayGift}
                    onCheckedChange={(v) => updateActive({ birthdayGift: v })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Number of withdrawals per day</Label>
                  <Input
                    type="number"
                    min={0}
                    value={activeRow.withdrawalsPerDay}
                    onChange={(e) =>
                      updateActive({ withdrawalsPerDay: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max. withdrawal (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={activeRow.maxWithdrawalUsd}
                    onChange={(e) =>
                      updateActive({ maxWithdrawalUsd: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Withdrawal fee (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={activeRow.withdrawalFeePercent}
                    onChange={(e) =>
                      updateActive({ withdrawalFeePercent: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Invite bonus (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={activeRow.inviteBonusUsd}
                    onChange={(e) =>
                      updateActive({ inviteBonusUsd: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Referral deposit fee (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={activeRow.referralDepositFeePercent}
                    onChange={(e) =>
                      updateActive({
                        referralDepositFeePercent: Number(e.target.value || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bonus wheel - Max reward (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={activeRow.bonusWheelMaxRewardUsd}
                    onChange={(e) =>
                      updateActive({
                        bonusWheelMaxRewardUsd: Number(e.target.value || 0),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Ngưỡng XP: min turnover tích lũy để lên bậc (web so sánh với balance.turnover).
          Badge URL để trống thì frontend dùng ảnh mặc định theo cấp. Tick và các ô USD/% phục vụ
          vận hành và hiển thị quyền lợi.
        </p>

        <AdminRelatedLinks
          links={[
            {
              to: "/vip-level",
              label: "Cấp VIP theo bậc (collection)",
              hint: "Tên level + XP trong Mongo",
            },
            {
              to: "/setting/site",
              label: "Cài đặt site",
            },
            {
              to: "/admin/theme",
              label: "Theme web & admin",
            },
          ]}
        />
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
