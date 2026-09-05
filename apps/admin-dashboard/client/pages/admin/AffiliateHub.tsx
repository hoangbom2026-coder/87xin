import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { Badge } from "@game/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@game/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@game/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@game/ui/select";
import { toast } from "@game/ui/use-toast";
import {
  Banknote, BarChart3, Eye, EyeOff, FileImage, Image as ImageIcon, ListChecks,
  PieChart, Plus, RefreshCw, Save, Search, Settings as SettingsIcon, Sparkles,
  Trash2, Upload, Users as UsersIcon, Wand2,
} from "lucide-react";
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getAffiliateExtrasApi,
  patchAffiliateExtrasApi,
  getAffiliateCounterApi,
  getAffiliateSignupsApi,
  getAffiliateCommissionSplitApi,
  listAffiliateFeedApi,
  createAffiliateFeedApi,
  generateAffiliateFeedNowApi,
  patchAffiliateFeedApi,
  deleteAffiliateFeedApi,
  purgeAffiliateAutoFeedApi,
  listAffiliateExtrasUsersApi,
  uploadSettingBannerAsset,
  AffiliateExtras,
  AffiliateFeedItem,
  AffiliateUserRow,
  AffiliateVipRebateTier,
} from "@/lib/api";

const tk = () => getAdminToken() || "";

const envBase = (import.meta as unknown as { env?: { VITE_BACKEND_URL?: string } }).env
  ?.VITE_BACKEND_URL;
const lsBase =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("__API_BASE")
    : null;
const winBase =
  typeof window !== "undefined" ? (window as unknown as { __API_BASE?: string }).__API_BASE : undefined;
const originApi = typeof window !== "undefined" ? `${window.location.origin}/api` : undefined;
const API_BASE =
  (lsBase && lsBase.trim()) || winBase || (envBase && envBase.trim()) || originApi || "/api";
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, "");
const fileSrc = (s?: string) => {
  if (!s) return "";
  if (/^https?:/i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return `${ASSET_HOST}/${s}`;
};

const fmt = new Intl.NumberFormat("vi-VN");
const money = (v: number, c = "USD") => `${fmt.format(Math.round(v))} ${c}`;
const pct = (v: number) => `${(v ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 4 })}%`;

export default function AffiliateHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "general";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "general") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };

  const [cfg, setCfg] = React.useState<AffiliateExtras | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const r = await getAffiliateExtrasApi(t);
      setCfg(r);
    } catch (e: unknown) {
      toast({ title: "Lỗi tải config", description: String((e as Error)?.message || e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function save(patch: Partial<AffiliateExtras>) {
    const t = tk();
    if (!t || !cfg) return;
    setSaving(true);
    try {
      const r = await patchAffiliateExtrasApi(patch, t);
      setCfg(r);
      toast({ title: "Đã lưu cấu hình affiliate" });
    } catch (e: unknown) {
      toast({ title: "Lỗi lưu", description: String((e as Error)?.message || e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <AdminPageHeader
            title="Affiliate Center"
            description="Logic Setup & Operations đầy đủ: nội dung CMS, cơ chế thưởng, real-time data, người dùng affiliate."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={load} disabled={loading}>
                  <RefreshCw className="mr-2 size-4" /> Tải lại
                </Button>
              </div>
            }
          />

          {!cfg ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Đang tải…</CardContent></Card>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="general"><ImageIcon className="size-3.5 mr-1" /> General (CMS)</TabsTrigger>
                <TabsTrigger value="rules"><SettingsIcon className="size-3.5 mr-1" /> Rules (Cơ chế)</TabsTrigger>
                <TabsTrigger value="data"><ListChecks className="size-3.5 mr-1" /> Data (Counter & Feed)</TabsTrigger>
                <TabsTrigger value="users"><UsersIcon className="size-3.5 mr-1" /> User Management</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="size-3.5 mr-1" /> Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-4">
                <GeneralTab cfg={cfg} setCfg={setCfg} save={save} saving={saving} />
              </TabsContent>
              <TabsContent value="rules" className="mt-4">
                <RulesTab cfg={cfg} setCfg={setCfg} save={save} saving={saving} />
              </TabsContent>
              <TabsContent value="data" className="mt-4">
                <DataTab cfg={cfg} setCfg={setCfg} save={save} saving={saving} />
              </TabsContent>
              <TabsContent value="users" className="mt-4">
                <UsersTab />
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <AnalyticsTab />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}

/* =====================================================
 * Tab General — CMS
 * ===================================================== */
function GeneralTab(props: {
  cfg: AffiliateExtras;
  setCfg: React.Dispatch<React.SetStateAction<AffiliateExtras | null>>;
  save: (p: Partial<AffiliateExtras>) => Promise<void>;
  saving: boolean;
}) {
  const { cfg, setCfg, save, saving } = props;

  async function uploadImage(field: "bannerImage" | `icon-${number}`, file: File) {
    const t = tk();
    if (!t) return;
    try {
      const { filename } = await uploadSettingBannerAsset(t, file);
      const url = `/${filename}`.replace(/^\/+/, "/");
      setCfg((c) => {
        if (!c) return c;
        if (field === "bannerImage") return { ...c, media: { ...c.media, bannerImage: url } };
        const idx = Number(field.split("-")[1] || 0);
        const icons = c.media.icons.slice() as AffiliateExtras["media"]["icons"];
        icons[idx] = url;
        return { ...c, media: { ...c.media, icons } };
      });
      toast({ title: "Đã upload — bấm Lưu để ghi DB" });
    } catch (e: unknown) {
      toast({ title: "Upload thất bại", description: String((e as Error)?.message || e), variant: "destructive" });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileImage className="size-4" /> Banner chính</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="aspect-[16/6] w-full overflow-hidden rounded border bg-muted">
            {cfg.media.bannerImage ? (
              <img src={fileSrc(cfg.media.bannerImage)} alt="banner" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">Chưa có ảnh</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]; if (f) void uploadImage("bannerImage", f);
            }} />
          </div>
          <Label>URL banner (chỉnh tay)</Label>
          <Input value={cfg.media.bannerImage} onChange={(e) => setCfg((c) => c && ({ ...c, media: { ...c.media, bannerImage: e.target.value } }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="size-4" /> 6 Icon minh hoạ (aff-1 → aff-6)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {cfg.media.icons.map((src, i) => (
            <div key={i} className="rounded border p-2 space-y-2">
              <div className="aspect-square overflow-hidden rounded bg-muted">
                {src ? <img src={fileSrc(src)} alt={`aff-${i + 1}`} className="size-full object-contain" /> : null}
              </div>
              <div className="text-[11px] text-muted-foreground">aff-{i + 1}.png</div>
              <Input
                className="h-8 text-xs"
                value={src}
                onChange={(e) => setCfg((c) => {
                  if (!c) return c;
                  const icons = c.media.icons.slice() as AffiliateExtras["media"]["icons"];
                  icons[i] = e.target.value;
                  return { ...c, media: { ...c.media, icons } };
                })}
              />
              <Input className="h-8 text-xs" type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0]; if (f) void uploadImage(`icon-${i}` as `icon-${number}`, f);
              }} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Slogan & nội dung headline</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Slogan đầu trang (Earning Title)</Label>
            <Input value={cfg.slogans.earningTitle} onChange={(e) => setCfg((c) => c && ({ ...c, slogans: { ...c.slogans, earningTitle: e.target.value } }))} /></div>
          <div className="space-y-2"><Label>Slogan club (Club Title)</Label>
            <Input value={cfg.slogans.clubTitle} onChange={(e) => setCfg((c) => c && ({ ...c, slogans: { ...c.slogans, clubTitle: e.target.value } }))} /></div>
          <div className="space-y-2"><Label>Banner Headline</Label>
            <Input value={cfg.slogans.bannerHeadline} onChange={(e) => setCfg((c) => c && ({ ...c, slogans: { ...c.slogans, bannerHeadline: e.target.value } }))} /></div>
          <div className="space-y-2"><Label>Banner Subline</Label>
            <Input value={cfg.slogans.bannerSubline} onChange={(e) => setCfg((c) => c && ({ ...c, slogans: { ...c.slogans, bannerSubline: e.target.value } }))} /></div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Email & Link hỗ trợ</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Email hỗ trợ hiển thị landing</Label>
            <Input value={cfg.media.supportEmail} onChange={(e) => setCfg((c) => c && ({ ...c, media: { ...c.media, supportEmail: e.target.value } }))} /></div>
          <div className="space-y-2"><Label>Link đối tác / Provider</Label>
            <Input value={cfg.media.partnerLink} onChange={(e) => setCfg((c) => c && ({ ...c, media: { ...c.media, partnerLink: e.target.value } }))} /></div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 sticky bottom-0 z-10 -mx-1 flex justify-end p-1">
        <Button onClick={() => save({ media: cfg.media, slogans: cfg.slogans })} disabled={saving}>
          <Save className="mr-2 size-4" /> {saving ? "Đang lưu…" : "Lưu General"}
        </Button>
      </div>
    </div>
  );
}

/* =====================================================
 * Tab Rules — Reward Rules + VIP Rebate
 * ===================================================== */
function RulesTab(props: {
  cfg: AffiliateExtras;
  setCfg: React.Dispatch<React.SetStateAction<AffiliateExtras | null>>;
  save: (p: Partial<AffiliateExtras>) => Promise<void>;
  saving: boolean;
}) {
  const { cfg, setCfg, save, saving } = props;

  function setTier(idx: number, patch: Partial<AffiliateVipRebateTier>) {
    setCfg((c) => {
      if (!c) return c;
      const next = c.vipRebate.slice();
      next[idx] = { ...next[idx], ...patch } as AffiliateVipRebateTier;
      return { ...c, vipRebate: next };
    });
  }
  function addTier() {
    setCfg((c) => {
      if (!c) return c;
      const lastLevel = c.vipRebate.at(-1)?.level ?? 0;
      return {
        ...c,
        vipRebate: [...c.vipRebate, { level: lastLevel + 1, label: `Tier ${lastLevel + 1}`, wagerThreshold: 0, rebatePercent: 0 }],
      };
    });
  }
  function removeTier(i: number) {
    setCfg((c) => c && ({ ...c, vipRebate: c.vipRebate.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Banknote className="size-4" /> Cơ chế Thưởng Giới thiệu</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-3 flex items-center gap-2">
            <Switch checked={cfg.signupReward.enabled} onCheckedChange={(v) => setCfg((c) => c && ({ ...c, signupReward: { ...c.signupReward, enabled: v } }))} />
            <span className="text-sm">{cfg.signupReward.enabled ? "Đang bật" : "Tắt"}</span>
          </div>
          <div className="space-y-2">
            <Label>Số tiền thưởng / 1 người mời</Label>
            <Input type="number" step={1} value={cfg.signupReward.amount}
              onChange={(e) => setCfg((c) => c && ({ ...c, signupReward: { ...c.signupReward, amount: Number(e.target.value) } }))} />
          </div>
          <div className="space-y-2">
            <Label>Đơn vị tiền</Label>
            <Select value={cfg.signupReward.currency} onValueChange={(v) => setCfg((c) => c && ({ ...c, signupReward: { ...c.signupReward, currency: v } }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="VND">VND</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Min Deposit (kích hoạt)</Label>
            <Input type="number" step={1} value={cfg.signupReward.minDeposit}
              onChange={(e) => setCfg((c) => c && ({ ...c, signupReward: { ...c.signupReward, minDeposit: Number(e.target.value) } }))} />
          </div>
          <div className="space-y-2">
            <Label>Min Wager (tổng cược)</Label>
            <Input type="number" step={1} value={cfg.signupReward.minWager}
              onChange={(e) => setCfg((c) => c && ({ ...c, signupReward: { ...c.signupReward, minWager: Number(e.target.value) } }))} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Ghi chú nội bộ</Label>
            <Textarea rows={2} value={cfg.signupReward.notes}
              onChange={(e) => setCfg((c) => c && ({ ...c, signupReward: { ...c.signupReward, notes: e.target.value } }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="size-4" /> Bảng VIP — Hoa hồng (Rebate %)</CardTitle>
          <Button size="sm" variant="outline" onClick={addTier}><Plus className="mr-1 size-4" /> Thêm bậc</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Level</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="w-44">Wager Threshold</TableHead>
                <TableHead className="w-32">Rebate %</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cfg.vipRebate.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input className="h-8 w-16" type="number" value={row.level} onChange={(e) => setTier(i, { level: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.label} onChange={(e) => setTier(i, { label: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" type="number" value={row.wagerThreshold} onChange={(e) => setTier(i, { wagerThreshold: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" type="number" step={0.01} value={row.rebatePercent} onChange={(e) => setTier(i, { rebatePercent: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="destructive" onClick={() => removeTier(i)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {cfg.vipRebate.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Chưa có bậc nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end pt-2">
        <Button onClick={() => save({ signupReward: cfg.signupReward, vipRebate: cfg.vipRebate })} disabled={saving}>
          <Save className="mr-2 size-4" /> {saving ? "Đang lưu…" : "Lưu Rules"}
        </Button>
      </div>
    </div>
  );
}

/* =====================================================
 * Tab Data — Counter + Real-time feed (CRUD)
 * ===================================================== */
function DataTab(props: {
  cfg: AffiliateExtras;
  setCfg: React.Dispatch<React.SetStateAction<AffiliateExtras | null>>;
  save: (p: Partial<AffiliateExtras>) => Promise<void>;
  saving: boolean;
}) {
  const { cfg, setCfg, save, saving } = props;
  const [items, setItems] = React.useState<AffiliateFeedItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [counter, setCounter] = React.useState<{ value: number; mode: string; currency: string; label: string } | null>(null);
  const [filter, setFilter] = React.useState<{ source: string; visible: string }>({ source: "all", visible: "all" });
  const [page, setPage] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [draft, setDraft] = React.useState({ username: "", amount: 100, currency: "USD", notes: "" });

  const refresh = React.useCallback(async () => {
    const t = tk();
    if (!t) return;
    setBusy(true);
    try {
      const [r1, r2] = await Promise.all([
        listAffiliateFeedApi({ ...filter, page, limit: 30 }, t),
        getAffiliateCounterApi(t),
      ]);
      setItems(r1.items); setTotal(r1.total); setCounter(r2);
    } finally {
      setBusy(false);
    }
  }, [filter, page]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function generateNow() {
    const t = tk(); if (!t) return;
    try { await generateAffiliateFeedNowApi(t); await refresh(); toast({ title: "Đã sinh 1 entry" }); } catch (e: unknown) {
      toast({ title: "Lỗi", description: String((e as Error)?.message || e), variant: "destructive" });
    }
  }
  async function purgeAuto() {
    const t = tk(); if (!t) return;
    if (!window.confirm("Xoá toàn bộ feed AUTO?")) return;
    try { const r = await purgeAffiliateAutoFeedApi(t); await refresh(); toast({ title: `Đã xoá ${r.removed} mục` }); } catch (e: unknown) {
      toast({ title: "Lỗi", description: String((e as Error)?.message || e), variant: "destructive" });
    }
  }
  async function toggleHide(it: AffiliateFeedItem) {
    const t = tk(); if (!t) return;
    await patchAffiliateFeedApi(it._id, { hidden: !it.hidden }, t); await refresh();
  }
  async function delItem(id: string) {
    const t = tk(); if (!t) return;
    if (!window.confirm("Xoá entry này?")) return;
    await deleteAffiliateFeedApi(id, t); await refresh();
  }
  async function addManual() {
    const t = tk(); if (!t) return;
    if (!draft.username.trim() || !draft.amount) { toast({ title: "Cần username & amount", variant: "destructive" }); return; }
    await createAffiliateFeedApi(draft, t); setDraft({ username: "", amount: 100, currency: "USD", notes: "" }); await refresh();
  }

  return (
    <div className="space-y-4">
      {/* Counter card */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">REWARDS SENT OUT TILL DATE</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counter ? money(counter.value, counter.currency) : "—"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Mode: {counter?.mode}</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Counter Setup</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={cfg.counter.mode} onValueChange={(v) => setCfg((c) => c && ({ ...c, counter: { ...c.counter, mode: v as "auto" | "manual" } }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Boost</SelectItem>
                  <SelectItem value="auto">Auto (cộng từ payout)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manual Base Amount</Label>
              <Input type="number" value={cfg.counter.manualBaseAmount}
                onChange={(e) => setCfg((c) => c && ({ ...c, counter: { ...c.counter, manualBaseAmount: Number(e.target.value) } }))} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={cfg.counter.currency}
                onChange={(e) => setCfg((c) => c && ({ ...c, counter: { ...c.counter, currency: e.target.value } }))} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Counter Label hiển thị</Label>
              <Input value={cfg.counter.label}
                onChange={(e) => setCfg((c) => c && ({ ...c, counter: { ...c.counter, label: e.target.value } }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fake feed config */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wand2 className="size-4" /> Real-time Fake Feed (Cron mềm)</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-4 flex items-center gap-2">
            <Switch checked={cfg.fakeFeed.enabled} onCheckedChange={(v) => setCfg((c) => c && ({ ...c, fakeFeed: { ...c.fakeFeed, enabled: v } }))} />
            <span className="text-sm">{cfg.fakeFeed.enabled ? "Đang chạy auto" : "Tắt"}</span>
            <Badge variant="outline" className="ml-auto">Tick mỗi 10s; sinh sau {cfg.fakeFeed.intervalSec}s</Badge>
          </div>
          <div className="space-y-2"><Label>Khoảng thời gian (giây)</Label>
            <Input type="number" min={10} value={cfg.fakeFeed.intervalSec}
              onChange={(e) => setCfg((c) => c && ({ ...c, fakeFeed: { ...c.fakeFeed, intervalSec: Number(e.target.value) } }))} /></div>
          <div className="space-y-2"><Label>Amount Min</Label>
            <Input type="number" value={cfg.fakeFeed.amountMin}
              onChange={(e) => setCfg((c) => c && ({ ...c, fakeFeed: { ...c.fakeFeed, amountMin: Number(e.target.value) } }))} /></div>
          <div className="space-y-2"><Label>Amount Max</Label>
            <Input type="number" value={cfg.fakeFeed.amountMax}
              onChange={(e) => setCfg((c) => c && ({ ...c, fakeFeed: { ...c.fakeFeed, amountMax: Number(e.target.value) } }))} /></div>
          <div className="space-y-2"><Label>Max rows trong feed</Label>
            <Input type="number" value={cfg.fakeFeed.maxRows}
              onChange={(e) => setCfg((c) => c && ({ ...c, fakeFeed: { ...c.fakeFeed, maxRows: Number(e.target.value) } }))} /></div>
          <div className="space-y-2 md:col-span-4"><Label>Mẫu username (mỗi dòng 1 mẫu, * sẽ random)</Label>
            <Textarea rows={4} value={cfg.fakeFeed.fakeUsernames.join("\n")}
              onChange={(e) => setCfg((c) => c && ({ ...c, fakeFeed: { ...c.fakeFeed, fakeUsernames: e.target.value.split(/\n+/).map((s) => s.trim()).filter(Boolean) } }))} /></div>
          <div className="md:col-span-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={generateNow}><Sparkles className="mr-1 size-4" /> Sinh ngay 1 entry</Button>
            <Button size="sm" variant="destructive" onClick={purgeAuto}><Trash2 className="mr-1 size-4" /> Xoá hết AUTO</Button>
            <Button size="sm" className="ml-auto" onClick={() => save({ fakeFeed: cfg.fakeFeed, counter: cfg.counter })} disabled={saving}>
              <Save className="mr-1 size-4" /> {saving ? "Đang lưu…" : "Lưu Counter & Feed"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual add */}
      <Card>
        <CardHeader><CardTitle className="text-base">Thêm thủ công 1 row</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Input placeholder="Username" value={draft.username} onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))} />
          <Input type="number" placeholder="Amount" value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) }))} />
          <Input placeholder="Currency" value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))} />
          <Input placeholder="Notes" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
          <Button onClick={addManual}><Plus className="mr-1 size-4" /> Thêm</Button>
        </CardContent>
      </Card>

      {/* Feed list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">PLATFORM REAL-TIME REWARDS ({total})</CardTitle>
          <div className="flex gap-2">
            <Select value={filter.source} onValueChange={(v) => { setFilter((f) => ({ ...f, source: v })); setPage(1); }}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nguồn</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="real">Real</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.visible} onValueChange={(v) => { setFilter((f) => ({ ...f, visible: v })); setPage(1); }}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hiện & ẩn</SelectItem>
                <SelectItem value="visible">Đang hiện</SelectItem>
                <SelectItem value="hidden">Đang ẩn</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={refresh} disabled={busy}><RefreshCw className="size-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it._id} className={it.hidden ? "opacity-50" : ""}>
                  <TableCell className="text-xs">{new Date(it.createdAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="font-medium">{it.username}</TableCell>
                  <TableCell>{money(it.amount, it.currency)}</TableCell>
                  <TableCell><Badge variant="outline">{it.source}</Badge></TableCell>
                  <TableCell>{it.hidden ? <Badge variant="secondary">hidden</Badge> : <Badge>visible</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => toggleHide(it)} title={it.hidden ? "Hiện" : "Ẩn"}>
                      {it.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => delItem(it._id)} title="Xoá">
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có row</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {total > 30 && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span>Trang {page}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
                <Button size="sm" variant="outline" disabled={page * 30 >= total} onClick={() => setPage((p) => p + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =====================================================
 * Tab Users — affiliateInit list
 * ===================================================== */
function UsersTab() {
  const [items, setItems] = React.useState<AffiliateUserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const refresh = React.useCallback(async () => {
    const t = tk(); if (!t) return;
    setBusy(true);
    try {
      const r = await listAffiliateExtrasUsersApi({ q, page, limit: 30 }, t);
      setItems(r.items); setTotal(r.total);
    } finally { setBusy(false); }
  }, [q, page]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-base">Người dùng đã tham gia Affiliate ({total})</CardTitle>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 w-64 pl-8" placeholder="Tìm username/email"
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <Button size="sm" variant="outline" onClick={refresh} disabled={busy}><RefreshCw className="size-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Tổng mời</TableHead>
              <TableHead>Mời hợp lệ</TableHead>
              <TableHead>H.hồng dự kiến (nay)</TableHead>
              <TableHead>H.hồng chốt (qua)</TableHead>
              <TableHead>Số dư h.hồng</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u._id}>
                <TableCell className="font-medium">
                  <div>{u.username}</div>
                  <div className="text-[10px] text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>{u.totalInvited || 0}</TableCell>
                <TableCell>{u.validInvited || 0}</TableCell>
                <TableCell className="text-blue-500 font-medium">{fmt.format(u.todayExpected || 0)}</TableCell>
                <TableCell className="text-emerald-500 font-medium">{fmt.format(u.yesterdayFinal || 0)}</TableCell>
                <TableCell className="text-orange-500 font-bold">{fmt.format(u.unclaimedBalance || 0)}</TableCell>
                <TableCell className="text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có user nào</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {total > 30 && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span>Trang {page}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
              <Button size="sm" variant="outline" disabled={page * 30 >= total} onClick={() => setPage((p) => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =====================================================
 * Tab Analytics — bar chart signups + pie commission split (SVG nội bộ)
 * ===================================================== */
function AnalyticsTab() {
  const [signups, setSignups] = React.useState<Array<{ date: string; count: number }>>([]);
  const [split, setSplit] = React.useState<{ signupReward: number; commission: number } | null>(null);
  const [days, setDays] = React.useState(14);

  React.useEffect(() => {
    const t = tk(); if (!t) return;
    void Promise.all([getAffiliateSignupsApi(days, t), getAffiliateCommissionSplitApi(t)])
      .then(([a, b]) => { setSignups(a); setSplit(b); }).catch(() => undefined);
  }, [days]);

  const max = Math.max(1, ...signups.map((s) => s.count));

  // Pie split
  const total = (split?.signupReward ?? 0) + (split?.commission ?? 0);
  const ratioReward = total > 0 ? (split!.signupReward / total) : 0;
  const angle = ratioReward * 2 * Math.PI;
  const r = 60, cx = 70, cy = 70;
  const x1 = cx + r * Math.sin(angle), y1 = cy - r * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;
  const piePath = total > 0 ? `M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 ${largeArc} 1 ${x1},${y1} Z` : "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="size-4" /> Affiliate signups / ngày</CardTitle>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="14">14 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="60">60 ngày</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {signups.map((s) => (
              <div key={s.date} className="flex-1 flex flex-col items-center gap-1" title={`${s.date}: ${s.count}`}>
                <div className="w-full rounded-sm bg-primary/70" style={{ height: `${(s.count / max) * 100}%` }} />
                <div className="text-[9px] text-muted-foreground rotate-45 origin-left">{s.date.slice(5)}</div>
              </div>
            ))}
            {signups.length === 0 && <div className="m-auto text-sm text-muted-foreground">Chưa có dữ liệu</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="size-4" /> Phân bổ thưởng vs hoa hồng</CardTitle></CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có giao dịch affiliate nào.</div>
          ) : (
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 140 140" width="140" height="140">
                <circle cx={cx} cy={cy} r={r} className="fill-muted" />
                {piePath && <path d={piePath} className="fill-primary" />}
              </svg>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="size-3 rounded-sm bg-primary" /> Signup Reward: <strong>{money(split!.signupReward)}</strong> ({Math.round(ratioReward * 100)}%)</div>
                <div className="flex items-center gap-2"><span className="size-3 rounded-sm bg-muted-foreground/40" /> Commission: <strong>{money(split!.commission)}</strong> ({Math.round((1 - ratioReward) * 100)}%)</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
