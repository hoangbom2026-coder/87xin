import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import {
  GATEWAY_LABELS_VI,
  PAYMENT_GATEWAY_SLUGS,
  type GatewayCredentialSlot,
  type PaymentGatewaySlug,
  type SystemIntegrationsDoc,
} from "@/lib/system-integrations-meta";
import { Save } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";

const tk = () => getAdminToken() || "";

const EMPTY: GatewayCredentialSlot = {
  enabled: false,
  sandbox: false,
  displayLabel: "",
  publicKey: "",
  secretKey: "",
  webhookSecret: "",
  merchantId: "",
  clientId: "",
  extraJson: "",
  notes: "",
};

export default function GatewayDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const valid = slug && PAYMENT_GATEWAY_SLUGS.includes(slug as PaymentGatewaySlug);
  const slugKey = (valid ? slug : "") as PaymentGatewaySlug;

  const [slot, setSlot] = React.useState<GatewayCredentialSlot>({ ...EMPTY });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const t = tk();
    if (!t || !valid) return;
    setLoading(true);
    try {
      const raw = (await getBusinessSettings(t)) as { systemIntegrations?: SystemIntegrationsDoc };
      const g = raw.systemIntegrations?.gateways?.[slugKey];
      setSlot(g ? { ...EMPTY, ...g } : { ...EMPTY });
    } catch (e: unknown) {
      toast({
        title: "Không tải được",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [valid, slugKey]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const t = tk();
    if (!t || !valid) return;
    setSaving(true);
    try {
      await patchBusinessSettings(
        { systemIntegrations: { gateways: { [slugKey]: slot } } },
        t,
      );
      toast({ title: "Đã lưu cổng" });
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

  if (!valid) {
    return (
      <RequireSuperAdmin>
        <AdminLayout>
          <p className="text-sm text-muted-foreground">Không tìm thấy cổng.</p>
          <Link to="/settings/gateways" className="mt-2 inline-block text-sm text-primary underline">
            Về danh sách
          </Link>
        </AdminLayout>
      </RequireSuperAdmin>
    );
  }

  const title = GATEWAY_LABELS_VI[slugKey];

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader title={title} description={`Slug: ${slugKey} — khóa bí mật chỉ lưu DB admin.`} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading || saving}>
            Tải lại
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/settings/gateways">← Danh sách</Link>
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={slot.enabled} onCheckedChange={(v) => setSlot((s) => ({ ...s, enabled: v }))} />
              <Label>Bật cổng</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={slot.sandbox} onCheckedChange={(v) => setSlot((s) => ({ ...s, sandbox: v }))} />
              <Label>Chế độ sandbox / test</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Thông tin hiển thị &amp; khóa</CardTitle>
          </CardHeader>
          <CardContent className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tên hiển thị (tuỳ chọn)</Label>
              <Input
                value={slot.displayLabel}
                onChange={(e) => setSlot((s) => ({ ...s, displayLabel: e.target.value }))}
                placeholder={title}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Public key / Publishable</Label>
              <Input
                value={slot.publicKey}
                onChange={(e) => setSlot((s) => ({ ...s, publicKey: e.target.value }))}
                className="font-mono text-xs"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Secret key</Label>
              <Input
                type="password"
                value={slot.secretKey}
                onChange={(e) => setSlot((s) => ({ ...s, secretKey: e.target.value }))}
                className="font-mono text-xs"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Webhook secret</Label>
              <Input
                type="password"
                value={slot.webhookSecret}
                onChange={(e) => setSlot((s) => ({ ...s, webhookSecret: e.target.value }))}
                className="font-mono text-xs"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Merchant ID</Label>
              <Input value={slot.merchantId} onChange={(e) => setSlot((s) => ({ ...s, merchantId: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Client ID</Label>
              <Input value={slot.clientId} onChange={(e) => setSlot((s) => ({ ...s, clientId: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>JSON mở rộng (tuỳ cổng)</Label>
              <Textarea
                className="min-h-[100px] font-mono text-xs"
                value={slot.extraJson}
                onChange={(e) => setSlot((s) => ({ ...s, extraJson: e.target.value }))}
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Ghi chú nội bộ</Label>
              <Textarea value={slot.notes} onChange={(e) => setSlot((s) => ({ ...s, notes: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
