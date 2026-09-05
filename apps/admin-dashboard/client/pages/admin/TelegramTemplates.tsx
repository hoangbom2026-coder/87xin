import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getBusinessSettings,
  getTelegramTemplates,
  patchBusinessSettings,
  sendTelegramTest,
  type TelegramEventDef,
  type TelegramTemplate,
} from "@/lib/api";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const tk = () => getAdminToken() || "";

type BotConfig = {
  token: string;
  adminChatId: string;
  enabled: boolean;
};

const COLOR_CLASS: Record<string, string> = {
  success: "bg-emerald-600 text-white",
  info: "bg-sky-600 text-white",
  warning: "bg-amber-500 text-black",
  danger: "bg-red-600 text-white",
  primary: "bg-indigo-600 text-white",
  secondary: "bg-slate-600 text-white",
};

function TargetBadge({ target }: { target: "admin" | "user" }) {
  return (
    <Badge
      variant="outline"
      className={
        target === "admin"
          ? "border-amber-500/60 text-amber-500"
          : "border-sky-500/60 text-sky-500"
      }
    >
      {target === "admin" ? "Admin" : "User"}
    </Badge>
  );
}

export default function TelegramTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const [bot, setBot] = useState<BotConfig>({
    token: "",
    adminChatId: "",
    enabled: false,
  });
  const [showToken, setShowToken] = useState(false);
  const [events, setEvents] = useState<TelegramEventDef[]>([]);
  const [templates, setTemplates] = useState<Record<string, TelegramTemplate>>(
    {},
  );

  async function loadAll() {
    setLoading(true);
    try {
      const t = tk();
      const [biz, tpls] = await Promise.all([
        getBusinessSettings(t),
        getTelegramTemplates(t),
      ]);
      const b = (biz as { telegramBot?: Partial<BotConfig> })?.telegramBot;
      setBot({
        token: b?.token ?? "",
        adminChatId: b?.adminChatId ?? "",
        enabled: Boolean(b?.enabled),
      });
      setEvents(tpls.events);
      setTemplates(tpls.templates);
    } catch (e) {
      toast({
        title: "Tải cấu hình thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const updateTpl = (key: string, patch: Partial<TelegramTemplate>) => {
    setTemplates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  async function saveAll() {
    setSaving(true);
    try {
      await patchBusinessSettings(
        {
          telegramBot: {
            token: bot.token.trim(),
            adminChatId: bot.adminChatId.trim(),
            enabled: bot.enabled,
            templates,
          },
        },
        tk(),
      );
      toast({ title: "Đã lưu cấu hình Telegram" });
      await loadAll();
    } catch (e) {
      toast({
        title: "Lưu thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function testEvent(eventKey?: string, chatId?: string) {
    setTestingKey(eventKey ?? "__bot__");
    try {
      await sendTelegramTest({ eventKey, chatId }, tk());
      toast({ title: "Đã gửi tin nhắn test thành công" });
    } catch (e) {
      toast({
        title: "Gửi thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setTestingKey(null);
    }
  }

  function resetToDefault(ev: TelegramEventDef) {
    updateTpl(ev.key, { content: ev.defaultContent, enabled: true });
    toast({ title: `Đã reset "${ev.label}" về mặc định` });
  }

  const enabledCount = useMemo(
    () =>
      events.reduce((acc, e) => {
        const t = templates[e.key];
        const enabled = t?.enabled !== false;
        const has = (t?.content ?? "").trim().length > 0;
        return acc + (enabled && has ? 1 : 0);
      }, 0),
    [events, templates],
  );

  if (loading) {
    return (
      <RequireSuperAdmin>
        <AdminLayout>
          <div className="p-4 text-sm text-muted-foreground">Đang tải…</div>
        </AdminLayout>
      </RequireSuperAdmin>
    );
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6 p-2 md:p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Cấu hình thông báo Telegram
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Cấu hình bot Telegram + nội dung từng loại thông báo. Để mặc
                định nếu không cần tùy chỉnh.{" "}
                <span className="font-medium">
                  Xóa hết nội dung trong ô để tắt thông báo của event đó.
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{enabledCount} event đang bật</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAll}
                disabled={saving}
              >
                <RefreshCw className="mr-2 size-4" />
                Tải lại
              </Button>
              <Button size="sm" onClick={saveAll} disabled={saving}>
                <Save className="mr-2 size-4" />
                {saving ? "Đang lưu…" : "Lưu tất cả"}
              </Button>
            </div>
          </div>

          {/* Bot config */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Cấu hình Bot</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="bot-enabled" className="text-sm">
                  Bật bot
                </Label>
                <Switch
                  id="bot-enabled"
                  checked={bot.enabled}
                  onCheckedChange={(v) =>
                    setBot((s) => ({ ...s, enabled: Boolean(v) }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="123456:ABC-DEF…"
                    value={bot.token}
                    onChange={(e) =>
                      setBot((s) => ({ ...s, token: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowToken((v) => !v)}
                  >
                    {showToken ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lấy từ @BotFather. Không chia sẻ với ai.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Admin Chat ID (group/channel)</Label>
                <Input
                  placeholder="-1001234567890"
                  value={bot.adminChatId}
                  onChange={(e) =>
                    setBot((s) => ({ ...s, adminChatId: e.target.value }))
                  }
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Mọi event &ldquo;Admin&rdquo; gửi vào chat ID này.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      !bot.enabled || !bot.token || testingKey === "__bot__"
                    }
                    onClick={() => testEvent(undefined, bot.adminChatId)}
                  >
                    <Send className="mr-1.5 size-4" />
                    Gửi test
                  </Button>
                </div>
              </div>

              {!bot.enabled && (
                <div className="md:col-span-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  Bot đang TẮT — không event nào được gửi đi dù template enabled.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Giữ mặc định nếu không cần tùy chỉnh. Để TẮT 1 event, hãy gạt
              công tắc OFF hoặc xóa hết nội dung. Hỗ trợ Markdown của Telegram
              (`*đậm*`, `_nghiêng_`, `\`code\``).
            </span>
          </div>

          {/* Templates grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((ev) => {
              const tpl: TelegramTemplate = templates[ev.key] ?? {
                key: ev.key,
                target: ev.target ?? 'admin',
                enabled: true,
                content: ev.defaultContent,
              };
              const headerClass =
                COLOR_CLASS[ev.color] ?? "bg-slate-700 text-white";
              return (
                <Card key={ev.key} className="overflow-hidden">
                  <div
                    className={
                      "flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium " +
                      headerClass
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{ev.label}</span>
                      <TargetBadge target={ev.target} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-white hover:bg-white/15"
                        title="Reset về mặc định"
                        onClick={() => resetToDefault(ev)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-white hover:bg-white/15"
                        title="Gửi test event này"
                        disabled={
                          !bot.enabled ||
                          !bot.token ||
                          testingKey === ev.key
                        }
                        onClick={() => testEvent(ev.key)}
                      >
                        <Send className="size-4" />
                      </Button>
                      <Switch
                        checked={tpl.enabled !== false}
                        onCheckedChange={(v) =>
                          updateTpl(ev.key, { enabled: Boolean(v) })
                        }
                        className="ml-1"
                      />
                    </div>
                  </div>
                  <CardContent className="space-y-2 pt-3">
                    <Textarea
                      rows={6}
                      className="font-mono text-xs"
                      placeholder="Nhập nội dung… (để trống = không gửi)"
                      value={tpl.content ?? ""}
                      onChange={(e) =>
                        updateTpl(ev.key, { content: e.target.value })
                      }
                    />
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Biến hỗ trợ: </span>
                      {ev.variables.map((v, i) => (
                        <code
                          key={v}
                          className="mx-0.5 rounded bg-muted px-1 py-0.5 text-[10px]"
                        >
                          {`{${v}}${i < ev.variables.length - 1 ? "" : ""}`}
                        </code>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="sticky bottom-0 -mx-2 mt-4 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-4">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={loadAll} disabled={saving}>
                Hủy thay đổi
              </Button>
              <Button onClick={saveAll} disabled={saving}>
                <Save className="mr-2 size-4" />
                {saving ? "Đang lưu…" : "Lưu tất cả"}
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
