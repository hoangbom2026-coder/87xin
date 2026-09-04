import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminRelatedLinks from "@/components/admin/AdminRelatedLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import {
  mergeReagentPage,
  CONDITION_TYPE_VI,
  REAGENT_CONDITION_TYPES,
  type IReagentEnrollmentCondition,
  type IReagentPage,
} from "@/lib/reagent-page-defaults";
import {
  mergeAffiliatePage,
  type MergedAffiliatePage,
  type AffiliateTabContentConfig,
  AFFILIATE_TAB_KEYS,
  type AffiliateWebTabKey,
} from "@/lib/affiliate-page-defaults";
import * as React from "react";
import { RefreshCw, Save, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadSettingBannerAsset } from "@/lib/api";

const tk = () => getAdminToken() || "";

const AFF_TAB_LABEL_VI: Record<AffiliateWebTabKey, string> = {
  dashboard: "Tab Bảng quản lý",
  rewards: "Tab Phần thưởng",
  codes: "Tab Mã & bạn bè",
  rules: "Tab Quy tắc",
  banners: "Tab Tài liệu / banner",
};

/** Nội dung form (dùng trong trang đầy đủ hoặc embed trong tab khác). */
export function MarketingAffiliateWebPanels() {
  const [reagent, setReagent] = React.useState<IReagentPage>(() =>
    mergeReagentPage(null),
  );
  const [affiliate, setAffiliate] = React.useState<MergedAffiliatePage>(() =>
    mergeAffiliatePage(null),
  );
  const [programRowsJson, setProgramRowsJson] = React.useState("");
  const [faqJson, setFaqJson] = React.useState("");
  const [affiliateFaqJson, setAffiliateFaqJson] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<Record<string, boolean>>({});

  async function handleUpload(field: keyof IReagentPage, file: File) {
    const t = tk();
    if (!t) return;
    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const res = await uploadSettingBannerAsset(t, file);
      const url = res.filename.startsWith("http") || res.filename.startsWith("/") 
        ? res.filename 
        : `/banners/${res.filename}`;
      setReagent((prev) => ({ ...prev, [field]: url }));
      toast({ title: "Tải ảnh thành công" });
    } catch (e: any) {
      toast({ title: "Tải ảnh thất bại", description: e?.message, variant: "destructive" });
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  }

  function applyDoc(doc: Record<string, unknown>) {
    const r = mergeReagentPage((doc.reagentPage as Partial<IReagentPage>) ?? null);
    setReagent(r);
    setProgramRowsJson(JSON.stringify(r.programRows, null, 2));
    setFaqJson(JSON.stringify(r.faqItems, null, 2));
    const mergedAffiliate = mergeAffiliatePage(((doc as { affiliatePage?: unknown }).affiliatePage ?? null) as never);
    setAffiliate(mergedAffiliate);
    setAffiliateFaqJson(JSON.stringify(mergedAffiliate.faqItems ?? [], null, 2));
  }

  async function load() {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const doc = (await getBusinessSettings(t)) as Record<string, unknown>;
      applyDoc(doc);
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

  function parseJson<T>(raw: string, label: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      toast({
        title: `JSON không hợp lệ: ${label}`,
        variant: "destructive",
      });
      return null;
    }
  }

  async function saveReagent() {
    const t = tk();
    if (!t) return;
    const rows = parseJson<IReagentPage["programRows"]>(programRowsJson, "Bảng chương trình");
    const faq = parseJson<IReagentPage["faqItems"]>(faqJson, "FAQ");
    if (!rows || !faq) return;
    setSaving(true);
    try {
      const payload = { ...reagent, programRows: rows, faqItems: faq };
      const res = (await patchBusinessSettings({ reagentPage: payload }, t)) as Record<
        string,
        unknown
      >;
      applyDoc(res);
      toast({ title: "Đã lưu trang đại lý (/reagent)" });
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

  async function saveAffiliate() {
    const t = tk();
    if (!t) return;
    const faq = parseJson<NonNullable<MergedAffiliatePage["faqItems"]>>(affiliateFaqJson, "FAQ affiliate");
    if (!faq) return;
    setSaving(true);
    try {
      const payload: MergedAffiliatePage = { ...affiliate, faqItems: faq };
      const res = (await patchBusinessSettings({ affiliatePage: payload }, t)) as Record<
        string,
        unknown
      >;
      applyDoc(res);
      toast({ title: "Đã lưu nội dung khu vực affiliate" });
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

  function patchAffTab(tab: AffiliateWebTabKey, p: Partial<AffiliateTabContentConfig>) {
    setAffiliate((prev) => ({
      ...prev,
      tabContent: {
        ...prev.tabContent,
        [tab]: { ...(prev.tabContent?.[tab] || {}), ...p },
      },
    }));
  }

  function setStat(i: number, field: "value" | "label", v: string) {
    setReagent((prev) => {
      const stats = [...prev.stats];
      stats[i] = { ...stats[i], [field]: v };
      return { ...prev, stats };
    });
  }

  function patchEnrollment(patch: Partial<IReagentPage["enrollment"]>) {
    setReagent((p) => ({ ...p, enrollment: { ...p.enrollment, ...patch } }));
  }

  function addEnrollmentConditionRow() {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c-${Date.now()}`;
    const row: IReagentEnrollmentCondition = {
      id,
      type: "min_balance",
      enabled: true,
      value: 0,
    };
    setReagent((p) => ({
      ...p,
      enrollment: { ...p.enrollment, conditions: [...p.enrollment.conditions, row] },
    }));
  }

  function removeEnrollmentConditionRow(idx: number) {
    setReagent((p) => ({
      ...p,
      enrollment: {
        ...p.enrollment,
        conditions: p.enrollment.conditions.filter((_, i) => i !== idx),
      },
    }));
  }

  function setEnrollmentConditionRow(
    idx: number,
    partial: Partial<IReagentEnrollmentCondition>,
  ) {
    setReagent((p) => ({
      ...p,
      enrollment: {
        ...p.enrollment,
        conditions: p.enrollment.conditions.map((c, i) => (i === idx ? { ...c, ...partial } : c)),
      },
    }));
  }

  return (
    <div className="space-y-6">
          <AdminPageHeader
            title="Nội dung web — Đại lý & Giới thiệu"
            description="Ghi vào MongoDB (settings.reagentPage, settings.affiliatePage). Site người chơi đọc GET /api/setting/site → site.reagentPage / site.affiliatePage."
            actions={
              <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className="mr-2 size-4" />
                {loading ? "Đang tải…" : "Tải từ DB"}
              </Button>
            }
          />

          <Tabs defaultValue="reagent" className="w-full">
            <TabsList>
              <TabsTrigger value="reagent">Trang đại lý (/reagent)</TabsTrigger>
              <TabsTrigger value="affiliate">Khu affiliate (/affiliate)</TabsTrigger>
            </TabsList>

            <TabsContent value="reagent" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Banner &amp; CTA</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-3xl">
                  <div className="grid gap-2">
                    <Label>Tiêu đề banner</Label>
                    <Input
                      value={reagent.bannerTitle}
                      onChange={(e) =>
                        setReagent((p) => ({ ...p, bannerTitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phụ đề</Label>
                    <Textarea
                      rows={2}
                      value={reagent.bannerSubtitle}
                      onChange={(e) =>
                        setReagent((p) => ({ ...p, bannerSubtitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ảnh nền banner (URL)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={reagent.backgroundUrl}
                          onChange={(e) =>
                            setReagent((p) => ({ ...p, backgroundUrl: e.target.value }))
                          }
                          className="flex-1"
                        />
                        <Label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-muted">
                          {uploading.backgroundUrl ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Upload className="size-4 text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload("backgroundUrl", f);
                            }}
                          />
                        </Label>
                      </div>
                      {reagent.backgroundUrl && (
                        <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-md border bg-muted/20">
                          <img src={reagent.backgroundUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Nút CTA — nhãn</Label>
                      <Input
                        value={reagent.ctaLabel}
                        onChange={(e) =>
                          setReagent((p) => ({ ...p, ctaLabel: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ảnh strip giữa trang (URL, để trống để ẩn)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={reagent.midBannerUrl ?? ""}
                        onChange={(e) =>
                          setReagent((p) => ({ ...p, midBannerUrl: e.target.value }))
                        }
                        placeholder="/images/promotions/hxpl-banner.webp"
                        className="flex-1"
                      />
                      <Label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-muted">
                        {uploading.midBannerUrl ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4 text-muted-foreground" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload("midBannerUrl", f);
                          }}
                        />
                      </Label>
                    </div>
                    {reagent.midBannerUrl && (
                      <div className="relative mt-2 h-16 w-full overflow-hidden rounded-md border bg-muted/20">
                        <img src={reagent.midBannerUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Nút CTA — đường dẫn (vd /affiliate)</Label>
                    <Input
                      value={reagent.ctaHref}
                      onChange={(e) =>
                        setReagent((p) => ({ ...p, ctaHref: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Điều kiện &amp; phí tham gia (/reagent → tạo mã giới thiệu)</CardTitle>
                  <p className="text-sm text-muted-foreground max-w-3xl">
                    Bật gate: chỉ sau khi user gọi <code className="text-xs bg-muted px-1 rounded">POST /api/reagent-program/join</code> và
                    thỏa &quot;tất cả điều kiện bật&quot; (AND) và trừ phí (nếu bật) mới được tạo mã. Tài khoản đã có mã trước đó không bị
                    chặn.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reagent.enrollment.gateEnabled}
                        onCheckedChange={(v) => patchEnrollment({ gateEnabled: v })}
                      />
                      <Label className="cursor-pointer">Bắt buộc gate</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reagent.enrollment.feeEnabled}
                        onCheckedChange={(v) => patchEnrollment({ feeEnabled: v })}
                      />
                      <Label className="cursor-pointer">Thu phí một lần (trừ số dư ví chính)</Label>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label>Mức phí ({reagent.enrollment.feeEnabled ? "bắt buộc nếu &gt; 0" : "—"})</Label>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={reagent.enrollment.feeAmount}
                        onChange={(e) =>
                          patchEnrollment({ feeAmount: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label>Ghi chú giao dịch phí</Label>
                      <Input
                        value={reagent.enrollment.feeDescriptionVi}
                        onChange={(e) => patchEnrollment({ feeDescriptionVi: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Thông báo khi không đủ điều kiện (403 tạo mã / toast)</Label>
                    <Textarea
                      rows={2}
                      value={reagent.enrollment.denyMessageVi}
                      onChange={(e) => patchEnrollment({ denyMessageVi: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                    <div className="text-sm font-medium">Danh sách điều kiện (AND các dòng được bật)</div>
                    <Button type="button" variant="outline" size="sm" onClick={addEnrollmentConditionRow}>
                      + Thêm điều kiện
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(reagent.enrollment.conditions || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Chưa có điều kiện tùy chỉnh — chỉ kiểm tra phí (nếu bật).
                      </p>
                    ) : null}
                    {reagent.enrollment.conditions.map((row, idx) => (
                      <div
                        key={row.id || idx}
                        className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto_120px_auto] sm:items-end"
                      >
                        <div className="grid gap-2 sm:col-span-2">
                          <Label className="text-xs text-muted-foreground">Loại</Label>
                          <Select
                            value={row.type}
                            onValueChange={(v) =>
                              setEnrollmentConditionRow(idx, {
                                type: v as IReagentEnrollmentCondition["type"],
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn loại" />
                            </SelectTrigger>
                            <SelectContent>
                              {REAGENT_CONDITION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {CONDITION_TYPE_VI[t]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Label className="text-xs text-muted-foreground mt-2">Nhãn hiển thị (tuỳ chọn)</Label>
                          <Input
                            placeholder="Landing / checklist"
                            value={row.labelVi ?? ""}
                            onChange={(e) =>
                              setEnrollmentConditionRow(idx, { labelVi: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Ngưỡng value</Label>
                          <Input
                            type="number"
                            min={0}
                            value={row.value}
                            onChange={(e) =>
                              setEnrollmentConditionRow(idx, {
                                value: Number(e.target.value) || 0,
                              })
                            }
                          />
                          {row.type === "kyc_verified" ? (
                            <span className="text-[11px] text-muted-foreground">≥1 = bắt buộc KYC</span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3 sm:flex-col">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={row.enabled}
                              onCheckedChange={(v) => setEnrollmentConditionRow(idx, { enabled: v })}
                            />
                            <Label className="text-xs whitespace-nowrap">Bật</Label>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeEnrollmentConditionRow(idx)}
                          >
                            Xoá
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3 ô thống kê</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 max-w-3xl">
                  {reagent.stats.map((s, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label>Giá trị {i + 1}</Label>
                        <Input value={s.value} onChange={(e) => setStat(i, "value", e.target.value)} />
                      </div>
                      <div>
                        <Label>Mô tả {i + 1}</Label>
                        <Input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bảng chương trình</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-3xl">
                  <div className="grid gap-2">
                    <Label>Tiêu đề bảng</Label>
                    <Input
                      value={reagent.programTitle}
                      onChange={(e) =>
                        setReagent((p) => ({ ...p, programTitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <Label>Cột 1 (header)</Label>
                      <Input
                        value={reagent.programHeaders.level}
                        onChange={(e) =>
                          setReagent((p) => ({
                            ...p,
                            programHeaders: { ...p.programHeaders, level: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Cột 2</Label>
                      <Input
                        value={reagent.programHeaders.players}
                        onChange={(e) =>
                          setReagent((p) => ({
                            ...p,
                            programHeaders: { ...p.programHeaders, players: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Cột 3</Label>
                      <Input
                        value={reagent.programHeaders.commission}
                        onChange={(e) =>
                          setReagent((p) => ({
                            ...p,
                            programHeaders: { ...p.programHeaders, commission: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Dòng bảng (JSON array)</Label>
                    <Textarea
                      className="font-mono text-xs min-h-[180px]"
                      value={programRowsJson}
                      onChange={(e) => setProgramRowsJson(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">FAQ</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-3xl">
                  <div className="grid gap-2">
                    <Label>Tiêu đề FAQ</Label>
                    <Input
                      value={reagent.faqTitle}
                      onChange={(e) =>
                        setReagent((p) => ({ ...p, faqTitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Mục FAQ (JSON: id, question, answer)</Label>
                    <Textarea
                      className="font-mono text-xs min-h-[220px]"
                      value={faqJson}
                      onChange={(e) => setFaqJson(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button type="button" onClick={saveReagent} disabled={saving || !tk()}>
                <Save className="mr-2 size-4" />
                {saving ? "Đang lưu…" : "Lưu trang đại lý"}
              </Button>
            </TabsContent>

            <TabsContent value="affiliate" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Banner đầu trang /affiliate</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Để trống tiêu đề/phụ đề → frontend dùng file ngôn ngữ (affiliate.banner.*).
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-3xl">
                  <div className="grid gap-2">
                    <Label>Tiêu đề (tuỳ chọn)</Label>
                    <Input
                      value={affiliate.pageBannerTitle}
                      onChange={(e) =>
                        setAffiliate((p) => ({ ...p, pageBannerTitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phụ đề (tuỳ chọn)</Label>
                    <Textarea
                      rows={2}
                      value={affiliate.pageBannerSubtitle}
                      onChange={(e) =>
                        setAffiliate((p) => ({ ...p, pageBannerSubtitle: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Banner &amp; khối nội dung · theo tab</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Mỗi tab trong <code className="text-xs">/affiliate/:tab</code> có PageBanner và khối giới thiệu (“Tìm hiểu
                    thêm…”) riêng. Để trống hero → dashboard dùng banner toàn cục phía trên; các tab khác fallback i18n
                    trong app.
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="flex h-auto flex-wrap gap-1">
                      {AFFILIATE_TAB_KEYS.map((k) => (
                        <TabsTrigger key={k} value={k} className="text-xs">
                          {AFF_TAB_LABEL_VI[k]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {AFFILIATE_TAB_KEYS.map((tab) => {
                      const tc = affiliate.tabContent?.[tab] || {};
                      return (
                        <TabsContent key={tab} value={tab} className="mt-4">
                          <div className="grid max-w-3xl gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`hide-promo-${tab}`}
                                checked={Boolean(tc.hidePromo)}
                                onCheckedChange={(v) =>
                                  patchAffTab(tab, { hidePromo: Boolean(v) })
                                }
                              />
                              <Label htmlFor={`hide-promo-${tab}`}>
                                Ẩn khối giới thiệu dưới tab (giữ banner đầu)
                              </Label>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="grid gap-2">
                                <Label>Tiêu đề hero (banner đầu tab)</Label>
                                <Input
                                  value={tc.heroTitle ?? ""}
                                  onChange={(e) =>
                                    patchAffTab(tab, { heroTitle: e.target.value })
                                  }
                                  placeholder={
                                    tab === "dashboard"
                                      ? "Để trống = dùng banner toàn cục hoặc i18n"
                                      : "Để trống = i18n theo ngôn ngữ app"
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Ảnh nền hero (tuỳ chọn)</Label>
                                <Input
                                  value={tc.heroBackground ?? ""}
                                  onChange={(e) =>
                                    patchAffTab(tab, { heroBackground: e.target.value })
                                  }
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label>Phụ đề hero</Label>
                              <Textarea
                                rows={2}
                                value={tc.heroSubtitle ?? ""}
                                onChange={(e) =>
                                  patchAffTab(tab, { heroSubtitle: e.target.value })
                                }
                              />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="grid gap-2">
                                <Label>Tiêu đề khối giới thiệu</Label>
                                <Input
                                  value={tc.promoTitle ?? ""}
                                  onChange={(e) =>
                                    patchAffTab(tab, { promoTitle: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Highlight (đoạn màu)</Label>
                                <Input
                                  value={tc.promoHighlight ?? ""}
                                  onChange={(e) =>
                                    patchAffTab(tab, { promoHighlight: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label>Nội dung khối giới thiệu</Label>
                              <Textarea
                                rows={3}
                                value={tc.promoBody ?? ""}
                                onChange={(e) =>
                                  patchAffTab(tab, { promoBody: e.target.value })
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Ảnh minh họa khối (URL)</Label>
                              <Input
                                value={tc.promoImage ?? ""}
                                onChange={(e) =>
                                  patchAffTab(tab, { promoImage: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Banner cố định (legacy dashboard)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Các ô dưới đây ghi vào <code className="text-xs">dashboardBanner*</code> — được merge vào tab Bảng
                    quản lý và layer mặc định của <code className="text-xs">tabContent</code>.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-3xl">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label>Tiêu đề (phần đầu)</Label>
                      <Input
                        value={affiliate.dashboardBannerTitle}
                        onChange={(e) =>
                          setAffiliate((p) => ({ ...p, dashboardBannerTitle: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Highlight (màu nhấn)</Label>
                      <Input
                        value={affiliate.dashboardBannerHighlight}
                        onChange={(e) =>
                          setAffiliate((p) => ({ ...p, dashboardBannerHighlight: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      rows={3}
                      value={affiliate.dashboardBannerBody}
                      onChange={(e) =>
                        setAffiliate((p) => ({ ...p, dashboardBannerBody: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Ảnh (URL)</Label>
                    <Input
                      value={affiliate.dashboardBannerImage}
                      onChange={(e) =>
                        setAffiliate((p) => ({ ...p, dashboardBannerImage: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tab Giới thiệu / mã</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 max-w-3xl">
                  <div className="grid gap-2">
                    <Label>Tiêu đề khối</Label>
                    <Input
                      value={affiliate.referralIntroTitle}
                      onChange={(e) =>
                        setAffiliate((p) => ({ ...p, referralIntroTitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nội dung (HTML nhẹ: p, strong, …)</Label>
                    <Textarea
                      rows={5}
                      className="font-mono text-xs"
                      value={affiliate.referralIntroBody}
                      onChange={(e) =>
                        setAffiliate((p) => ({ ...p, referralIntroBody: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tab Quy tắc (HTML)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 max-w-3xl">
                  <Textarea
                    rows={12}
                    className="font-mono text-xs"
                    value={affiliate.rulesHtml}
                    onChange={(e) =>
                      setAffiliate((p) => ({ ...p, rulesHtml: e.target.value }))
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">FAQ (Affiliate)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Hiển thị ở các khu có dùng <code>FaqSection</code> (vd trang đại lý embed). Định dạng JSON: mảng các
                    object <code>id?</code>, <code>question</code>, <code>answer</code>.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-2 max-w-3xl">
                  <Textarea
                    rows={10}
                    className="font-mono text-xs min-h-[220px]"
                    value={affiliateFaqJson}
                    onChange={(e) => setAffiliateFaqJson(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Button type="button" onClick={saveAffiliate} disabled={saving || !tk()}>
                <Save className="mr-2 size-4" />
                {saving ? "Đang lưu…" : "Lưu nội dung affiliate"}
              </Button>
            </TabsContent>
          </Tabs>

          <AdminRelatedLinks
            links={[
              { to: "/setting/site", label: "Trung tâm điều khiển site" },
              { to: "/referral-code", label: "Referrals (backend)" },
            ]}
          />
    </div>
  );
}

export default function MarketingAffiliateWebPage() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <MarketingAffiliateWebPanels />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
