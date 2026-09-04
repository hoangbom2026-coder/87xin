import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@game/ui/tabs";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import type { SystemIntegrationsGeneral } from "@/lib/system-integrations-meta";
import { Save } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

const tk = () => getAdminToken() || "";

const DEFAULT_GENERAL: SystemIntegrationsGeneral = {
  preloaderEnabled: false,
  preloaderImageUrl: "",
  googleAnalyticsMeasurementId: "",
  googleTagManagerContainerId: "",
  cookieConsentHtml: "",
  recaptchaSiteKey: "",
  recaptchaSecretKey: "",
  liveChatSnippetHtml: "",
  globalSeoDefaultTitle: "",
  globalSeoDefaultDescription: "",
  globalSeoDefaultOgImageUrl: "",
};

export default function IntegrationExperiencePage() {
  const [g, setG] = React.useState<SystemIntegrationsGeneral>({ ...DEFAULT_GENERAL });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function load() {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const raw = (await getBusinessSettings(t)) as {
        systemIntegrations?: { general?: SystemIntegrationsGeneral };
      };
      const gen = raw.systemIntegrations?.general;
      setG(gen ? { ...DEFAULT_GENERAL, ...gen } : { ...DEFAULT_GENERAL });
    } catch (e: unknown) {
      toast({
        title: "Không tải được",
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
      await patchBusinessSettings({ systemIntegrations: { general: g } }, t);
      toast({ title: "Đã lưu cấu hình trải nghiệm / SEO" });
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

  function set<K extends keyof SystemIntegrationsGeneral>(key: K, v: SystemIntegrationsGeneral[K]) {
    setG((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <AdminPageHeader
            title="Trải nghiệm &amp; SEO"
            description="Preloader, Analytics, cookie, reCAPTCHA, live chat, SEO mặc định toàn site (lưu Mongo, admin-only)."
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading || saving}>
              Tải lại
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              <Save className="mr-2 size-4" />
              {saving ? "Đang lưu…" : "Lưu tất cả tab"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="preloader" className="mt-6 w-full">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="preloader">Preloader</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="cookie">Cookie</TabsTrigger>
            <TabsTrigger value="recaptcha">reCAPTCHA</TabsTrigger>
            <TabsTrigger value="chat">Live chat</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="preloader" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preloader</CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Switch checked={g.preloaderEnabled} onCheckedChange={(v) => set("preloaderEnabled", v)} />
                  <Label>Bật preloader</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>URL ảnh / GIF</Label>
                  <Input value={g.preloaderImageUrl} onChange={(e) => set("preloaderImageUrl", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Google Analytics &amp; GTM</CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl space-y-4">
                <div className="space-y-1.5">
                  <Label>Measurement ID (G-…)</Label>
                  <Input
                    value={g.googleAnalyticsMeasurementId}
                    onChange={(e) => set("googleAnalyticsMeasurementId", e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>GTM Container ID</Label>
                  <Input
                    value={g.googleTagManagerContainerId}
                    onChange={(e) => set("googleTagManagerContainerId", e.target.value)}
                    placeholder="GTM-XXXX"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookie" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cookie consent</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-xs text-muted-foreground">HTML snippet (banner / nút đồng ý)</Label>
                <Textarea
                  className="mt-2 min-h-[200px] font-mono text-xs"
                  value={g.cookieConsentHtml}
                  onChange={(e) => set("cookieConsentHtml", e.target.value)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recaptcha" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Google reCAPTCHA</CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl space-y-4">
                <div className="space-y-1.5">
                  <Label>Site key</Label>
                  <Input value={g.recaptchaSiteKey} onChange={(e) => set("recaptchaSiteKey", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Secret key</Label>
                  <Input
                    type="password"
                    value={g.recaptchaSecretKey}
                    onChange={(e) => set("recaptchaSecretKey", e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live chat</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-xs text-muted-foreground">Snippet nhúng (Tawk, Crisp, …)</Label>
                <Textarea
                  className="mt-2 min-h-[200px] font-mono text-xs"
                  value={g.liveChatSnippetHtml}
                  onChange={(e) => set("liveChatSnippetHtml", e.target.value)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SEO mặc định</CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl space-y-4">
                <div className="space-y-1.5">
                  <Label>Title mặc định</Label>
                  <Input value={g.globalSeoDefaultTitle} onChange={(e) => set("globalSeoDefaultTitle", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta description</Label>
                  <Textarea
                    rows={3}
                    value={g.globalSeoDefaultDescription}
                    onChange={(e) => set("globalSeoDefaultDescription", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>OG image URL</Label>
                  <Input
                    value={g.globalSeoDefaultOgImageUrl}
                    onChange={(e) => set("globalSeoDefaultOgImageUrl", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-xs text-muted-foreground">
          <Link to="/settings/system" className="text-primary underline-offset-4 hover:underline">
            ← Trung tâm cài đặt
          </Link>
        </p>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
