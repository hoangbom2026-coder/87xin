import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import {
  getEmailSettingsApi,
  patchEmailSettingsApi,
  sendEmailTestApi,
  type EmailConfigPayload,
  type EmailEventDef,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Mail, RotateCcw, Save, Send } from "lucide-react";

export default function EmailSettingsPage() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [config, setConfig] = useState<EmailConfigPayload | null>(null);
  const [templates, setTemplates] = useState<EmailEventDef[]>([]);
  const [defaults, setDefaults] = useState<Record<string, { defaultSubject: string; defaultHtml: string }>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const r = await getEmailSettingsApi(token);
      setConfig(r.config);
      setTemplates(r.templates || []);
      const d: Record<string, { defaultSubject: string; defaultHtml: string }> = {};
      (r.events || []).forEach((e) => {
        d[e.key] = { defaultSubject: e.defaultSubject, defaultHtml: e.defaultHtml };
      });
      setDefaults(d);
    } catch (e: any) {
      toast({ title: "Lỗi tải email settings", description: e?.message, variant: "destructive" });
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  function patchTemplate(key: string, p: Partial<{ enabled: boolean; subject: string; html: string }>) {
    setTemplates((arr) => arr.map((t) => (t.key === key ? { ...t, ...p } : t)));
  }
  function resetTemplate(key: string) {
    const def = defaults[key];
    if (!def) return;
    patchTemplate(key, { subject: def.defaultSubject, html: def.defaultHtml });
  }

  async function save() {
    if (!config) return;
    setBusy(true);
    try {
      const tplPayload: Record<string, { enabled: boolean; subject: string; html: string }> = {};
      templates.forEach((t) => {
        tplPayload[t.key] = { enabled: t.enabled, subject: t.subject, html: t.html };
      });
      await patchEmailSettingsApi({ config, templates: tplPayload }, token);
      toast({ title: "Đã lưu cấu hình email" });
      reload();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }
  async function sendTest(eventKey?: string) {
    if (!testTo) { toast({ title: "Nhập email nhận test" }); return; }
    try {
      await sendEmailTestApi({ to: testTo, eventKey }, token);
      toast({ title: "Đã gửi email test" });
    } catch (e: any) {
      toast({ title: "Lỗi gửi test", description: e?.message, variant: "destructive" });
    }
  }

  if (!config) {
    return <AdminLayout><div className="text-muted-foreground">Đang tải…</div></AdminLayout>;
  }

  const enabledCount = templates.filter((t) => t.enabled).length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Mail className="size-6" /> Cấu hình Email</h1>
          <p className="text-sm text-muted-foreground">SMTP server + 6 template thông báo cho user.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{enabledCount}/{templates.length} event đang bật</Badge>
          <Button onClick={save} disabled={busy}>
            <Save className="mr-2 size-4" /> Lưu tất cả
          </Button>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>SMTP</CardTitle>
          <CardDescription>Cấu hình SMTP server để gửi email từ {config.from || "(chưa cấu hình)"}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
            <Label>Bật gửi email</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From email</Label>
              <Input value={config.from} onChange={(e) => setConfig({ ...config, from: e.target.value })} placeholder="no-reply@domain.com" />
            </div>
            <div>
              <Label>Reply-To (tùy chọn)</Label>
              <Input value={config.replyTo || ""} onChange={(e) => setConfig({ ...config, replyTo: e.target.value })} placeholder="support@domain.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SMTP Host</Label>
              <Input value={config.smtpHost} onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <Label>SMTP Port</Label>
              <Input type="number" value={config.smtpPort} onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SMTP User</Label>
              <Input value={config.smtpUser} onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })} />
            </div>
            <div>
              <Label>SMTP Password</Label>
              <div className="flex">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={config.smtpPass}
                  onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                />
                <Button type="button" variant="outline" size="icon" className="ml-2" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Để trống không thay đổi mật khẩu hiện tại.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={config.smtpSecure} onCheckedChange={(v) => setConfig({ ...config, smtpSecure: v })} />
            <Label>TLS/SSL (port 465)</Label>
          </div>
          <div className="border-t pt-4 flex items-end gap-3">
            <div className="flex-1">
              <Label>Email nhận test</Label>
              <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="me@example.com" />
            </div>
            <Button variant="outline" onClick={() => sendTest()}><Send className="mr-2 size-4" /> Gửi raw test</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Template thông báo</CardTitle>
          <CardDescription>
            Để trống nội dung sẽ dùng template mặc định. Tắt switch để vô hiệu event đó.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {templates.map((t) => (
            <div key={t.key} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={t.target === "admin" ? "destructive" : "secondary"}>{t.target}</Badge>
                  <h3 className="font-semibold">{t.label}</h3>
                  <code className="text-xs text-muted-foreground">{t.key}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => resetTemplate(t.key)}>
                    <RotateCcw className="mr-1 size-4" /> Mặc định
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sendTest(t.key)}>
                    <Send className="mr-1 size-4" /> Test
                  </Button>
                  <Switch checked={t.enabled} onCheckedChange={(v) => patchTemplate(t.key, { enabled: v })} />
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input value={t.subject} onChange={(e) => patchTemplate(t.key, { subject: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">HTML body</Label>
                  <Textarea
                    rows={6}
                    className="font-mono text-xs"
                    value={t.html}
                    onChange={(e) => patchTemplate(t.key, { html: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Biến hỗ trợ:</strong> {t.variables.map((v) => `{${v}}`).join(", ")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-2 mt-4 flex justify-end gap-2 bg-background/80 backdrop-blur p-2 rounded-md border">
        <Button variant="outline" onClick={reload}>Hủy thay đổi</Button>
        <Button onClick={save} disabled={busy}><Save className="mr-2 size-4" /> Lưu tất cả</Button>
      </div>
    </AdminLayout>
  );
}
