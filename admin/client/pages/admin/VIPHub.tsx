import {
  Crown,
  Gauge,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Trophy,
  UsersRound,
  RotateCcw,
  Save,
} from "lucide-react";
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getVipStatsApi,
  listVipUsersApi,
  VipStats,
  VipUserRow,
  getBusinessSettings,
  patchBusinessSettings,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  mergeVipProgramLevels,
  type IVipProgramLevel,
} from "@/lib/vip-program-defaults";
import {
  applyVipPreset,
  VIP_PRESET_LABELS,
  type VipPresetId,
} from "@/lib/vip-program-presets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const tk = () => getAdminToken() || "";
const fmt = new Intl.NumberFormat("vi-VN");

function patchLevel(
  rows: IVipProgramLevel[],
  level: number,
  patch: Partial<IVipProgramLevel>,
): IVipProgramLevel[] {
  return rows.map((r) => (r.level === level ? { ...r, ...patch, level } : r));
}

export default function VIPHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <AdminPageHeader
            title="Chương trình VIP"
            description="Cấp bậc VIP, quà cấp, cashback, vòng quay. Tách biệt với Đại lý/Affiliate/Store — chỉ làm việc với vipLevel & vipXp của user."
          />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="overview">
                <Trophy className="h-3.5 w-3.5 mr-1" /> Tổng quan
              </TabsTrigger>
              <TabsTrigger value="users">
                <UsersRound className="h-3.5 w-3.5 mr-1" /> Người chơi VIP
              </TabsTrigger>
              <TabsTrigger value="config">
                <SettingsIcon className="h-3.5 w-3.5 mr-1" /> Cấu hình
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <VipUsersTab />
            </TabsContent>
            <TabsContent value="config" className="mt-4">
              <ConfigTab />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}

function ConfigTab() {
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

  function onPresetChange(id: VipPresetId) {
    setPreset(id);
    setRows(applyVipPreset(rows, id));
    toast({
      title: `Đã áp: ${VIP_PRESET_LABELS[id]}`,
      description: "Kiểm tra bảng rồi Lưu để ghi MongoDB.",
    });
  }

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Preset nhanh:</span>
          <Select
            value={preset}
            onValueChange={(v) => onPresetChange(v as VipPresetId)}
          >
            <SelectTrigger className="h-9 w-[200px]">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading || saving}
          >
            <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
            {loading ? "Đang tải…" : "Tải từ DB"}
          </Button>
        </div>
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Đang lưu…" : "Lưu vào DB"}
        </Button>
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
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                      selectedLevel === r.level
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/40"
                    )}
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
                <span className="text-sm text-muted-foreground">Personal gift</span>
                <Switch
                  checked={activeRow.personalGift}
                  onCheckedChange={(v) => updateActive({ personalGift: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">VIP manager</span>
                <Switch
                  checked={activeRow.vipManager}
                  onCheckedChange={(v) => updateActive({ vipManager: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority withdrawal</span>
                <Switch
                  checked={activeRow.priorityWithdrawal}
                  onCheckedChange={(v) => updateActive({ priorityWithdrawal: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Birthday gift</span>
                <Switch
                  checked={activeRow.birthdayGift}
                  onCheckedChange={(v) => updateActive({ birthdayGift: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Number of withdrawals per day</Label>
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
                <Label className="text-xs text-muted-foreground">Max. withdrawal (USD)</Label>
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
                <Label className="text-xs text-muted-foreground">Withdrawal fee (%)</Label>
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
                <Label className="text-xs text-muted-foreground">Invite bonus (USD)</Label>
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
                <Label className="text-xs text-muted-foreground">Referral deposit fee (%)</Label>
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
                <Label className="text-xs text-muted-foreground">Bonus wheel - Max reward (USD)</Label>
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
    </div>
  );
}
