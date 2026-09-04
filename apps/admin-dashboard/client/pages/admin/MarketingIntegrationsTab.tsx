import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import { AlertTriangle, RefreshCw, Save } from "lucide-react";
import * as React from "react";

type MarketingOps = {
  featureFlags: {
    promotionsCmsEnabled: boolean;
    depositBonusHighlight: boolean;
    notifyOnPromoMaintenance: boolean;
  };
  integrationSlots: Array<{
    id: string;
    label: string;
    enabled: boolean;
    referenceKey?: string;
    endpointUrl?: string;
    notes?: string;
  }>;
};

const tk = () => getAdminToken() || "";

export default function MarketingIntegrationsTab() {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [ops, setOps] = React.useState<MarketingOps | null>(null);

  async function load() {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const doc = (await getBusinessSettings(t)) as { marketingOps?: MarketingOps };
      setOps(doc.marketingOps ?? null);
    } catch (e: unknown) {
      toast({
        title: "Không tải được marketingOps",
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
    if (!ops) return;
    const t = tk();
    if (!t) return;
    setSaving(true);
    try {
      await patchBusinessSettings({ marketingOps: ops }, t);
      toast({ title: "Đã lưu cấu hình marketing / tích hợp" });
      await load();
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

  if (!ops) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {loading ? "Đang tải…" : "Không có dữ liệu — thử làm mới"}
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 size-4" />
          Tải lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Cơ chế &amp; tích hợp</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Bật/tắt nhóm KM, gán ID công khai (GA/Pixel/Telegram) và URL webhook. Secret thanh toán nằm .env server,
          không lưu Mongo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        Secret API (gateway, casino, AGPay…) cấu hình trên server, không vào MongoDB.
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading || saving}>
          <RefreshCw className="mr-2 size-4" />
          {loading ? "Đang tải…" : "Tải từ DB"}
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Đang lưu…" : "Lưu vào DB"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Công tắc vận hành</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["promotionsCmsEnabled", "Hiển thị / CMS khuyến mãi", ops.featureFlags.promotionsCmsEnabled],
              ["depositBonusHighlight", "Nhấn mạnh bonus nạp (UI có thể đọc cờ)", ops.featureFlags.depositBonusHighlight],
              ["notifyOnPromoMaintenance", "Thông báo khi KM bảo trì", ops.featureFlags.notifyOnPromoMaintenance],
            ] as const
          ).map(([key, label, checked]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
            >
              <span className="text-sm leading-snug">{label}</span>
              <Switch
                checked={checked}
                onCheckedChange={(v) =>
                  setOps({
                    ...ops,
                    featureFlags: {
                      ...ops.featureFlags,
                      [key]: Boolean(v),
                    },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Slot tích hợp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {ops.integrationSlots.map((slot, idx) => (
            <div
              key={slot.id}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto] sm:items-start"
            >
              <div className="space-y-1 min-w-0">
                <div className="font-medium text-sm">{slot.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{slot.id}</div>
              </div>
              <div className="flex justify-end">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Bật</span>
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={(v) => {
                      const next = [...ops.integrationSlots];
                      next[idx] = { ...next[idx], enabled: Boolean(v) };
                      setOps({ ...ops, integrationSlots: next });
                    }}
                  />
                </div>
              </div>
              <Input
                className="sm:col-span-2"
                placeholder="Key / Measurement ID / Pixel ID (công khai)"
                value={slot.referenceKey ?? ""}
                onChange={(e) => {
                  const next = [...ops.integrationSlots];
                  next[idx] = { ...next[idx], referenceKey: e.target.value };
                  setOps({ ...ops, integrationSlots: next });
                }}
              />
              <Input
                className="sm:col-span-2 font-mono text-xs"
                placeholder="URL endpoint (https://…)"
                value={slot.endpointUrl ?? ""}
                onChange={(e) => {
                  const next = [...ops.integrationSlots];
                  next[idx] = { ...next[idx], endpointUrl: e.target.value };
                  setOps({ ...ops, integrationSlots: next });
                }}
              />
              <Textarea
                className="sm:col-span-2 min-h-[56px]"
                placeholder="Ghi chú nội bộ…"
                value={slot.notes ?? ""}
                onChange={(e) => {
                  const next = [...ops.integrationSlots];
                  next[idx] = { ...next[idx], notes: e.target.value };
                  setOps({ ...ops, integrationSlots: next });
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Frontend đọc thêm cờ và dữ liệu công khai qua <code className="rounded bg-muted px-1">GET /setting/site</code>{" "}
        → <code className="rounded bg-muted px-1">site.marketingOps</code> sau khi bạn chỉnh &amp; lưu.
      </p>
    </div>
  );
}
