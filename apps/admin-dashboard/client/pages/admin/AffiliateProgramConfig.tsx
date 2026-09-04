import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getBusinessSettings,
  patchBusinessSettings,
  uploadSettingBannerAsset,
  runAffiliateAutoPayout,
} from "@/lib/api";
import { MarketingAffiliateWebPanels } from "@/pages/admin/MarketingAffiliateWeb";
import * as React from "react";
import {
  Play,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Coins,
  Wallet,
  Clock3,
  Users,
  AlertTriangle,
} from "lucide-react";

const tk = () => getAdminToken() || "";

const envBase = (import.meta as unknown as { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL;
const lsBase =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("__API_BASE")
    : null;
const winBase = typeof window !== "undefined" ? (window as unknown as { __API_BASE?: string }).__API_BASE : undefined;
const originApi =
  typeof window !== "undefined" ? `${window.location.origin}/api` : undefined;
const API_BASE = (lsBase && lsBase.trim()) || winBase || (envBase && envBase.trim()) || originApi || "/api";
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, "");

export type AffiliateTierDraft = {
  level: number;
  ratio: number;
  label?: string;
};

export type MarketingMaterialDraft = {
  id: string;
  title: string;
  description?: string;
  image: string;
  targetUrl?: string;
  width?: number;
  height?: number;
  tags?: string[];
};

export type AffiliateProgramDraft = {
  enabled: boolean;
  baseRate: number;
  tiers: AffiliateTierDraft[];
  signupRewardUsd: number;
  accrualCron?: string;
  autoPayout: {
    enabled: boolean;
    cron: string;
    minThreshold: number;
  };
  marketingMaterials: MarketingMaterialDraft[];
};

export type AffiliateMechanismDraft = {
  commission_rates: {
    slots_fishing: number;
    others: number;
    lottery: number;
  };
  referral_bonus: {
    inviter_reward: number;
    invitee_reward: number;
    min_deposit: number;
    min_valid_bet: number;
  };
  multi_level_ratio: number;
  withdrawal_condition: {
    turnover_x: number;
    expiry_days: number;
  };
};

type AffiliateOpsDraft = {
  affiliateStatus: boolean;
  cookieDays: number;
  minCommissionVnd: number;
  rechargeCommissionEnabled: boolean;
  rechargeCommissionRate: number;
  orderCommissionEnabled: boolean;
  orderCommissionRate: number;
  minWithdrawVnd: number;
  supportedBanksText: string;
  telegramWithdrawChatId: string;
  memberNoteHtml: string;
  pendingWithdrawAlertEnabled: boolean;
  pendingWithdrawAlertLink: string;
};

function defaultProgram(): AffiliateProgramDraft {
  return {
    enabled: true,
    baseRate: 0.01,
    tiers: [
      { level: 1, ratio: 0.5, label: "F1" },
      { level: 2, ratio: 0.25, label: "F2" },
      { level: 3, ratio: 0.125, label: "F3" },
    ],
    signupRewardUsd: 0,
    accrualCron: "*/30 * * * *",
    autoPayout: {
      enabled: false,
      cron: "0 0 * * *",
      minThreshold: 100,
    },
    marketingMaterials: [],
  };
}

function defaultMechanism(): AffiliateMechanismDraft {
  return {
    commission_rates: {
      slots_fishing: 0.3,
      others: 0.2,
      lottery: 0,
    },
    referral_bonus: {
      inviter_reward: 88,
      invitee_reward: 58,
      min_deposit: 1000,
      min_valid_bet: 3000,
    },
    multi_level_ratio: 10,
    withdrawal_condition: {
      turnover_x: 1,
      expiry_days: 30,
    },
  };
}

function mergeProgram(raw: unknown): AffiliateProgramDraft {
  const d = defaultProgram();
  if (!raw || typeof raw !== "object") return d;
  const p = raw as Partial<AffiliateProgramDraft>;
  return {
    enabled: typeof p.enabled === "boolean" ? p.enabled : d.enabled,
    baseRate: typeof p.baseRate === "number" ? p.baseRate : d.baseRate,
    tiers: Array.isArray(p.tiers) && p.tiers.length ? p.tiers.map((t, i) => ({
      level: typeof t.level === "number" ? t.level : i + 1,
      ratio: typeof t.ratio === "number" ? t.ratio : 0,
      label: typeof t.label === "string" ? t.label : "",
    })) : d.tiers,
    signupRewardUsd: typeof p.signupRewardUsd === "number" ? p.signupRewardUsd : d.signupRewardUsd,
    accrualCron: typeof p.accrualCron === "string" ? p.accrualCron : d.accrualCron,
    autoPayout: {
      enabled: typeof p.autoPayout?.enabled === "boolean" ? p.autoPayout.enabled : d.autoPayout.enabled,
      cron: typeof p.autoPayout?.cron === "string" ? p.autoPayout.cron : d.autoPayout.cron,
      minThreshold:
        typeof p.autoPayout?.minThreshold === "number" ? p.autoPayout.minThreshold : d.autoPayout.minThreshold,
    },
    marketingMaterials: Array.isArray(p.marketingMaterials)
      ? p.marketingMaterials.map((m) => ({
          id: String(m.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
          title: String(m.title || ""),
          description: m.description ? String(m.description) : "",
          image: String(m.image || ""),
          targetUrl: m.targetUrl ? String(m.targetUrl) : "",
          width: typeof m.width === "number" ? m.width : undefined,
          height: typeof m.height === "number" ? m.height : undefined,
          tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
        }))
      : d.marketingMaterials,
  };
}

function defaultOps(): AffiliateOpsDraft {
  return {
    affiliateStatus: true,
    cookieDays: 30,
    minCommissionVnd: 1000,
    rechargeCommissionEnabled: false,
    rechargeCommissionRate: 5,
    orderCommissionEnabled: true,
    orderCommissionRate: 5,
    minWithdrawVnd: 10000,
    supportedBanksText: "Vietcombank\nMBBank\nTechcombank",
    telegramWithdrawChatId: "",
    memberNoteHtml: "<p>Chia sẻ liên kết affiliate để nhận hoa hồng.</p>",
    pendingWithdrawAlertEnabled: true,
    pendingWithdrawAlertLink: "/affiliate-withdraw?status=pending",
  };
}

function mergeOps(raw: unknown): AffiliateOpsDraft {
  const d = defaultOps();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Partial<AffiliateOpsDraft>;
  return {
    affiliateStatus: o.affiliateStatus ?? d.affiliateStatus,
    cookieDays: typeof o.cookieDays === "number" ? o.cookieDays : d.cookieDays,
    minCommissionVnd:
      typeof o.minCommissionVnd === "number" ? o.minCommissionVnd : d.minCommissionVnd,
    rechargeCommissionEnabled:
      o.rechargeCommissionEnabled ?? d.rechargeCommissionEnabled,
    rechargeCommissionRate:
      typeof o.rechargeCommissionRate === "number"
        ? o.rechargeCommissionRate
        : d.rechargeCommissionRate,
    orderCommissionEnabled: o.orderCommissionEnabled ?? d.orderCommissionEnabled,
    orderCommissionRate:
      typeof o.orderCommissionRate === "number"
        ? o.orderCommissionRate
        : d.orderCommissionRate,
    minWithdrawVnd:
      typeof o.minWithdrawVnd === "number" ? o.minWithdrawVnd : d.minWithdrawVnd,
    supportedBanksText:
      typeof o.supportedBanksText === "string"
        ? o.supportedBanksText
        : d.supportedBanksText,
    telegramWithdrawChatId:
      typeof o.telegramWithdrawChatId === "string"
        ? o.telegramWithdrawChatId
        : d.telegramWithdrawChatId,
    memberNoteHtml:
      typeof o.memberNoteHtml === "string" ? o.memberNoteHtml : d.memberNoteHtml,
    pendingWithdrawAlertEnabled:
      o.pendingWithdrawAlertEnabled ?? d.pendingWithdrawAlertEnabled,
    pendingWithdrawAlertLink:
      typeof o.pendingWithdrawAlertLink === "string"
        ? o.pendingWithdrawAlertLink
        : d.pendingWithdrawAlertLink,
  };
}

function mergeMechanism(raw: unknown): AffiliateMechanismDraft {
  const d = defaultMechanism();
  if (!raw || typeof raw !== "object") return d;
  const m = raw as any;
  return {
    commission_rates: {
      slots_fishing: m.commission_rates?.slots_fishing ?? d.commission_rates.slots_fishing,
      others: m.commission_rates?.others ?? d.commission_rates.others,
      lottery: m.commission_rates?.lottery ?? d.commission_rates.lottery,
    },
    referral_bonus: {
      inviter_reward: m.referral_bonus?.inviter_reward ?? d.referral_bonus.inviter_reward,
      invitee_reward: m.referral_bonus?.invitee_reward ?? d.referral_bonus.invitee_reward,
      min_deposit: m.referral_bonus?.min_deposit ?? d.referral_bonus.min_deposit,
      min_valid_bet: m.referral_bonus?.min_valid_bet ?? d.referral_bonus.min_valid_bet,
    },
    multi_level_ratio: m.multi_level_ratio ?? d.multi_level_ratio,
    withdrawal_condition: {
      turnover_x: m.withdrawal_condition?.turnover_x ?? d.withdrawal_condition.turnover_x,
      expiry_days: m.withdrawal_condition?.expiry_days ?? d.withdrawal_condition.expiry_days,
    },
  };
}

/** 5–6 trường cron cơ bản (node-cron); không bắt buộc giây. */
function looksLikeCronExpr(s: string) {
  const t = s.trim();
  if (!t) return false;
  const parts = t.split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

export default function AffiliateProgramConfigAdmin() {
  const [program, setProgram] = React.useState<AffiliateProgramDraft>(() => defaultProgram());
  const [ops, setOps] = React.useState<AffiliateOpsDraft>(() => defaultOps());
  const [mechanism, setMechanism] = React.useState<AffiliateMechanismDraft>(() => defaultMechanism());
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [runningPayout, setRunningPayout] = React.useState(false);

  const [draftMaterial, setDraftMaterial] = React.useState<MarketingMaterialDraft>({
    id: "",
    title: "",
    description: "",
    image: "",
    targetUrl: "",
    tags: [],
  });
  const [tagsStr, setTagsStr] = React.useState("");

  async function load() {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const doc = (await getBusinessSettings(t)) as {
        affiliateProgram?: unknown;
        affiliateOps?: unknown;
        affiliateMechanism?: unknown;
      };
      setProgram(mergeProgram(doc.affiliateProgram));
      setOps(mergeOps(doc.affiliateOps));
      setMechanism(mergeMechanism(doc.affiliateMechanism));
      toast({ title: "Đã tải cài đặt affiliate" });
    } catch (e: unknown) {
      toast({
        title: "Không tải được settings",
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

  function normalizeTiers(tiers: AffiliateTierDraft[]): AffiliateTierDraft[] {
    return tiers.map((row, idx) => ({
      ...row,
      level: idx + 1,
    }));
  }

  async function saveProgram() {
    const t = tk();
    if (!t) return;
    if (!looksLikeCronExpr(program.accrualCron || "")) {
      toast({ title: "Cron tích luỹ không hợp lệ", variant: "destructive" });
      return;
    }
    if (!looksLikeCronExpr(program.autoPayout.cron || "")) {
      toast({ title: "Cron auto-payout không hợp lệ", variant: "destructive" });
      return;
    }
    const payload: AffiliateProgramDraft = {
      ...program,
      tiers: normalizeTiers(program.tiers),
    };
    setSaving(true);
    try {
      const res = (await patchBusinessSettings(
        { affiliateProgram: payload, affiliateOps: ops, affiliateMechanism: mechanism },
        t
      )) as {
        affiliateProgram?: unknown;
        affiliateOps?: unknown;
        affiliateMechanism?: unknown;
      };
      setProgram(mergeProgram(res.affiliateProgram ?? payload));
      setOps(mergeOps(res.affiliateOps ?? ops));
      setMechanism(mergeMechanism(res.affiliateMechanism ?? mechanism));
      toast({ title: "Đã lưu chương trình affiliate" });
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

  async function onRunPayout() {
    const t = tk();
    if (!t) return;
    setRunningPayout(true);
    try {
      const res = await runAffiliateAutoPayout(t);
      toast({
        title: "Đã chạy auto-payout",
        description: typeof res === "object" ? JSON.stringify(res).slice(0, 240) : String(res),
      });
    } catch (e: unknown) {
      toast({
        title: "Chạy payout thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setRunningPayout(false);
    }
  }

  function addTier() {
    setProgram((p) => {
      const nextLevel = p.tiers.length + 1;
      return {
        ...p,
        tiers: normalizeTiers([
          ...p.tiers,
          { level: nextLevel, ratio: nextLevel === 1 ? 0.5 : 0.1, label: `F${nextLevel}` },
        ]),
      };
    });
  }

  function removeTier(idx: number) {
    setProgram((p) => ({
      ...p,
      tiers: normalizeTiers(p.tiers.filter((_, i) => i !== idx)),
    }));
  }

  function moveTier(from: number, to: number) {
    if (to < 0 || to >= program.tiers.length) return;
    setProgram((p) => {
      const next = [...p.tiers];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row!);
      return { ...p, tiers: normalizeTiers(next) };
    });
  }

  async function uploadMaterialThumb(file: File) {
    const t = tk();
    if (!t) return;
    try {
      const { filename } = await uploadSettingBannerAsset(t, file);
      setDraftMaterial((m) => ({ ...m, image: filename }));
      toast({ title: "Đã upload ảnh (chưa lưu DB — bấm Lưu chương trình)" });
    } catch (e: unknown) {
      toast({
        title: "Upload thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  }

  function addMaterialFromDraft() {
    if (!draftMaterial.title.trim() || !draftMaterial.image.trim()) {
      toast({ title: "Cần title + ảnh", variant: "destructive" });
      return;
    }
    const tags = tagsStr
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const id = draftMaterial.id || crypto.randomUUID?.() || `m-${Date.now()}`;
    setProgram((p) => ({
      ...p,
      marketingMaterials: [
        ...p.marketingMaterials,
        {
          ...draftMaterial,
          id,
          tags,
        },
      ],
    }));
    setDraftMaterial({
      id: "",
      title: "",
      description: "",
      image: "",
      targetUrl: "",
      tags: [],
    });
    setTagsStr("");
    toast({ title: "Đã thêm vào danh sách — bấm Lưu chương trình để ghi DB" });
  }

  function removeMaterial(idx: number) {
    setProgram((p) => ({
      ...p,
      marketingMaterials: p.marketingMaterials.filter((_, i) => i !== idx),
    }));
  }

  function moveMaterial(from: number, to: number) {
    if (to < 0 || to >= program.marketingMaterials.length) return;
    setProgram((p) => {
      const next = [...p.marketingMaterials];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row!);
      return { ...p, marketingMaterials: next };
    });
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Cấu hình Affiliate"
            description="Quản lý đầy đủ Affiliate Program: trạng thái, hoa hồng, rút tiền, cron payout, nội dung hướng dẫn, tài liệu marketing."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
                  <RefreshCw className="mr-2 size-4" />
                  {loading ? "Đang tải…" : "Tải lại"}
                </Button>
                <Button type="button" size="sm" onClick={saveProgram} disabled={saving}>
                  <Save className="mr-2 size-4" />
                  {saving ? "Đang lưu…" : "Lưu chương trình"}
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng hoa hồng đã trả</p>
                    <h4 className="mt-2 text-xl font-semibold">
                      {Number(program.signupRewardUsd || 0).toLocaleString("vi-VN")}đ
                    </h4>
                  </div>
                  <Coins className="size-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đã rút thành công</p>
                    <h4 className="mt-2 text-xl font-semibold">0đ</h4>
                  </div>
                  <Wallet className="size-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Số dư chưa rút</p>
                    <h4 className="mt-2 text-xl font-semibold">
                      {Number(program.autoPayout.minThreshold || 0).toLocaleString("vi-VN")}đ
                    </h4>
                  </div>
                  <Clock3 className="size-6 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng Affiliates</p>
                    <h4 className="mt-2 text-xl font-semibold">
                      {program.tiers.length} <small className="text-xs text-muted-foreground">tầng</small>
                    </h4>
                  </div>
                  <Users className="size-6 text-sky-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {ops.pendingWithdrawAlertEnabled && (
            <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                <span>
                  Có yêu cầu rút tiền affiliate đang chờ xử lý.
                </span>
              </div>
              <a
                href={ops.pendingWithdrawAlertLink || "#"}
                className="font-medium text-amber-700 underline"
              >
                Xem ngay
              </a>
            </div>
          )}

          <Tabs defaultValue="tiers" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="general">Cấu hình chung</TabsTrigger>
              <TabsTrigger value="shbet">Cơ chế SHBET</TabsTrigger>
              <TabsTrigger value="tiers">Hoa hồng & cấp</TabsTrigger>
              <TabsTrigger value="payout">Tự chi trả</TabsTrigger>
              <TabsTrigger value="cms">Nội dung CMS</TabsTrigger>
              <TabsTrigger value="materials">Tài liệu marketing</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cấu hình chung</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Trạng thái Affiliate</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ops.affiliateStatus}
                        onCheckedChange={(v) => setOps((s) => ({ ...s, affiliateStatus: v }))}
                      />
                      <span className="text-sm">{ops.affiliateStatus ? "Bật" : "Tắt"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Thời gian lưu Cookie (ngày)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      value={ops.cookieDays}
                      onChange={(e) =>
                        setOps((s) => ({ ...s, cookieDays: Number(e.target.value) || 1 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số tiền hoa hồng tối thiểu (VNĐ)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={ops.minCommissionVnd}
                      onChange={(e) =>
                        setOps((s) => ({ ...s, minCommissionVnd: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hoa hồng nạp tiền / đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Hoa hồng nạp tiền</Label>
                      <Switch
                        checked={ops.rechargeCommissionEnabled}
                        onCheckedChange={(v) =>
                          setOps((s) => ({ ...s, rechargeCommissionEnabled: v }))
                        }
                      />
                    </div>
                    <Label>Tỷ lệ (%)</Label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={100}
                      value={ops.rechargeCommissionRate}
                      onChange={(e) =>
                        setOps((s) => ({
                          ...s,
                          rechargeCommissionRate: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="rounded border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Hoa hồng đơn hàng</Label>
                      <Switch
                        checked={ops.orderCommissionEnabled}
                        onCheckedChange={(v) =>
                          setOps((s) => ({ ...s, orderCommissionEnabled: v }))
                        }
                      />
                    </div>
                    <Label>Tỷ lệ (%)</Label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={100}
                      value={ops.orderCommissionRate}
                      onChange={(e) =>
                        setOps((s) => ({
                          ...s,
                          orderCommissionRate: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cấu hình rút tiền & thông báo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Số tiền rút tối thiểu (VNĐ)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={ops.minWithdrawVnd}
                      onChange={(e) =>
                        setOps((s) => ({ ...s, minWithdrawVnd: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telegram Chat ID nhận thông báo rút</Label>
                    <Input
                      value={ops.telegramWithdrawChatId}
                      onChange={(e) =>
                        setOps((s) => ({ ...s, telegramWithdrawChatId: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Danh sách ngân hàng hỗ trợ (mỗi dòng 1 ngân hàng)</Label>
                    <Textarea
                      rows={4}
                      value={ops.supportedBanksText}
                      onChange={(e) =>
                        setOps((s) => ({ ...s, supportedBanksText: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Switch
                      checked={ops.pendingWithdrawAlertEnabled}
                      onCheckedChange={(v) =>
                        setOps((s) => ({ ...s, pendingWithdrawAlertEnabled: v }))
                      }
                    />
                    <span className="text-sm">Hiển thị cảnh báo pending withdraw</span>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Link xem pending withdraw</Label>
                    <Input
                      value={ops.pendingWithdrawAlertLink}
                      onChange={(e) =>
                        setOps((s) => ({ ...s, pendingWithdrawAlertLink: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nội dung hướng dẫn cho thành viên (HTML)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={8}
                    value={ops.memberNoteHtml}
                    onChange={(e) => setOps((s) => ({ ...s, memberNoteHtml: e.target.value }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shbet" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tỷ lệ hoa hồng (%)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nổ hũ & Bắn cá</Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={mechanism.commission_rates.slots_fishing}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          commission_rates: { ...prev.commission_rates, slots_fishing: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sảnh khác (Thể thao, Casino...)</Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={mechanism.commission_rates.others}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          commission_rates: { ...prev.commission_rates, others: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xổ số</Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={mechanism.commission_rates.lottery}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          commission_rates: { ...prev.commission_rates, lottery: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thưởng giới thiệu & Điều kiện</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Thưởng người mời (Points)</Label>
                    <Input
                      type="number"
                      value={mechanism.referral_bonus.inviter_reward}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          referral_bonus: { ...prev.referral_bonus, inviter_reward: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thưởng người được mời (Points)</Label>
                    <Input
                      type="number"
                      value={mechanism.referral_bonus.invitee_reward}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          referral_bonus: { ...prev.referral_bonus, invitee_reward: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Điều kiện Nạp tối thiểu (Points)</Label>
                    <Input
                      type="number"
                      value={mechanism.referral_bonus.min_deposit}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          referral_bonus: { ...prev.referral_bonus, min_deposit: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Điều kiện Cược tối thiểu (Points)</Label>
                    <Input
                      type="number"
                      value={mechanism.referral_bonus.min_valid_bet}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          referral_bonus: { ...prev.referral_bonus, min_valid_bet: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đa cấp & Rút tiền</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tỷ lệ hưởng tầng dưới (%) - vd 10%</Label>
                    <Input
                      type="number"
                      value={mechanism.multi_level_ratio}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          multi_level_ratio: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số vòng cược yêu cầu khi rút</Label>
                    <Input
                      type="number"
                      value={mechanism.withdrawal_condition.turnover_x}
                      onChange={(e) =>
                        setMechanism((prev) => ({
                          ...prev,
                          withdrawal_condition: { ...prev.withdrawal_condition, turnover_x: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tiers" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bật chương trình</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={program.enabled}
                      onCheckedChange={(v) => setProgram((p) => ({ ...p, enabled: v }))}
                    />
                    <span className="text-sm">Enabled</span>
                  </div>
                  <div className="grid gap-1">
                    <Label>baseRate (phần của cược, vd 0.01 = 1%)</Label>
                    <Input
                      className="max-w-[200px]"
                      type="number"
                      step={0.0001}
                      value={program.baseRate}
                      onChange={(e) =>
                        setProgram((p) => ({ ...p, baseRate: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label>Thưởng đăng ký (USD)</Label>
                    <Input
                      className="max-w-[200px]"
                      type="number"
                      step={1}
                      value={program.signupRewardUsd}
                      onChange={(e) =>
                        setProgram((p) => ({ ...p, signupRewardUsd: Number(e.target.value) }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Bậc tier (ratio 0–1)</CardTitle>
                  <Button type="button" size="sm" variant="outline" onClick={addTier}>
                    <Plus className="mr-2 size-4" />
                    Thêm bậc
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {program.tiers.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:flex-wrap sm:items-end"
                    >
                      <div className="grid gap-1">
                        <Label>Cấp</Label>
                        <Input className="w-24" value={row.level} readOnly />
                      </div>
                      <div className="grid gap-1 min-w-[140px] flex-1">
                        <Label>Label</Label>
                        <Input
                          value={row.label || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProgram((p) => {
                              const tiers = [...p.tiers];
                              tiers[idx] = { ...tiers[idx]!, label: v };
                              return { ...p, tiers };
                            });
                          }}
                        />
                      </div>
                      <div className="grid gap-1 min-w-[140px] flex-1">
                        <Label>Ratio</Label>
                        <Input
                          type="number"
                          step={0.0001}
                          value={row.ratio}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setProgram((p) => {
                              const tiers = [...p.tiers];
                              tiers[idx] = { ...tiers[idx]!, ratio: v };
                              return { ...p, tiers };
                            });
                          }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveTier(idx, idx - 1)}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveTier(idx, idx + 1)}
                          disabled={idx === program.tiers.length - 1}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeTier(idx)}
                          disabled={program.tiers.length <= 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payout" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cron tích luỹ hoa hồng (accrual)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 max-w-xl">
                  <Label>Biểu thức cron</Label>
                  <Input
                    value={program.accrualCron || ""}
                    onChange={(e) => setProgram((p) => ({ ...p, accrualCron: e.target.value }))}
                    placeholder="*/30 * * * *"
                  />
                  <p className="text-xs text-muted-foreground">
                    Đổi cron ở đây sẽ reschedule job phía server sau khi Lưu.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Auto-payout</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={program.autoPayout.enabled}
                      onCheckedChange={(v) =>
                        setProgram((p) => ({
                          ...p,
                          autoPayout: { ...p.autoPayout, enabled: v },
                        }))
                      }
                    />
                    <span className="text-sm">Bật</span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 max-w-xl">
                  <div className="grid gap-1">
                    <Label>Cron chi trả</Label>
                    <Input
                      value={program.autoPayout.cron}
                      onChange={(e) =>
                        setProgram((p) => ({
                          ...p,
                          autoPayout: { ...p.autoPayout, cron: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label>Ngưỡng tối thiểu (quy USD)</Label>
                    <Input
                      type="number"
                      value={program.autoPayout.minThreshold}
                      onChange={(e) =>
                        setProgram((p) => ({
                          ...p,
                          autoPayout: {
                            ...p.autoPayout,
                            minThreshold: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onRunPayout}
                    disabled={runningPayout}
                  >
                    <Play className="mr-2 size-4" />
                    {runningPayout ? "Đang chạy…" : "Chạy payout ngay"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cms" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CMS Đại lý & Giới thiệu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Lưu ý: các nút Lưu trong form bên dưới chỉ ghi `reagentPage` / `affiliatePage`. Hãy lưu tab
                    &quot;Hoa hồng &amp; cấp&quot; trước nếu bạn vừa chỉnh `affiliateProgram`.
                  </p>
                  <MarketingAffiliateWebPanels />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thêm tài liệu</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-2xl">
                  <div className="grid gap-1">
                    <Label>Tiêu đề</Label>
                    <Input
                      value={draftMaterial.title}
                      onChange={(e) => setDraftMaterial((m) => ({ ...m, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={draftMaterial.description || ""}
                      onChange={(e) =>
                        setDraftMaterial((m) => ({ ...m, description: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label>URL đích (tuỳ chọn)</Label>
                    <Input
                      value={draftMaterial.targetUrl || ""}
                      onChange={(e) =>
                        setDraftMaterial((m) => ({ ...m, targetUrl: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label>Tags (phân tách bằng dấu phẩy)</Label>
                    <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadMaterialThumb(f);
                    }} />
                    {draftMaterial.image ? (
                      <img
                        src={`${ASSET_HOST}/${draftMaterial.image}`}
                        alt=""
                        className="h-16 rounded border object-contain bg-muted p-1"
                      />
                    ) : null}
                  </div>
                  <Button type="button" onClick={addMaterialFromDraft}>
                    Thêm vào danh sách
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đã cấu hình ({program.marketingMaterials.length})</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {program.marketingMaterials.map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center"
                    >
                      {m.image ? (
                        <img
                          src={`${ASSET_HOST}/${m.image}`}
                          alt=""
                          className="h-20 w-32 shrink-0 rounded border object-cover bg-muted"
                        />
                      ) : (
                        <div className="h-20 w-32 shrink-0 rounded border bg-muted" />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-medium">{m.title}</div>
                        {m.description ? (
                          <div className="text-xs text-muted-foreground line-clamp-2">{m.description}</div>
                        ) : null}
                        {m.targetUrl ? (
                          <div className="break-all font-mono text-[11px] text-muted-foreground">{m.targetUrl}</div>
                        ) : null}
                      </div>
                      <div className="flex gap-1 self-end sm:self-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveMaterial(idx, idx - 1)}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveMaterial(idx, idx + 1)}
                          disabled={idx === program.marketingMaterials.length - 1}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="destructive" onClick={() => removeMaterial(idx)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {program.marketingMaterials.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Chưa có tài liệu</div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
