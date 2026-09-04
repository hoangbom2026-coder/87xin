import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminRelatedLinks from "@/components/admin/AdminRelatedLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Textarea } from "@game/ui/textarea";
import { Label } from "@game/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@game/ui/tabs";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import {
  DEFAULT_ADMIN_MAIN,
  DEFAULT_WEB_MAIN,
  mergeAdminMain,
  mergeWebMain,
} from "@/lib/ui-theme-defaults";
import * as React from "react";
import { ChevronDown, Save } from "lucide-react";

const token = () => getAdminToken() || "";

const WEB_KEYS = Object.keys(DEFAULT_WEB_MAIN) as (keyof typeof DEFAULT_WEB_MAIN)[];
const ADMIN_KEYS = Object.keys(DEFAULT_ADMIN_MAIN) as (keyof typeof DEFAULT_ADMIN_MAIN)[];

const DEFAULT_SCSS_PLACE = `$themes: (
  main: (
    header: #1B1A1A,
  )
);
`;

const DEFAULT_SCSS_ADMIN = `$themes: (
  dark: (
    text: white,
    background: #1a191e,
  )
);
`;

function ColorRow({
  k,
  value,
  onChange,
}: {
  k: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isLikelyHex =
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ||
    value.startsWith("rgba") ||
    value.startsWith("rgb(");
  return (
    <div className="grid gap-1.5 sm:grid-cols-[160px_1fr_auto] sm:items-center border-b border-border/60 py-2 last:border-0">
      <Label className="text-xs font-medium text-muted-foreground truncate" title={k}>
        {k}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs h-9"
        spellCheck={false}
      />
      {isLikelyHex && /^#([0-9a-f]{6})$/i.test(value.trim()) ? (
        <input
          type="color"
          aria-label={`Chọn màu ${k}`}
          className="h-9 w-full max-w-[72px] cursor-pointer rounded border bg-background sm:w-14"
          value={value.trim().slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="hidden sm:block w-14 shrink-0 rounded border h-9 bg-muted/40" />
      )}
    </div>
  );
}

export default function ThemeEditor() {
  const [webMain, setWebMain] = React.useState<Record<string, string>>(() =>
    mergeWebMain(null),
  );
  const [adminMain, setAdminMain] = React.useState<Record<string, string>>(() =>
    mergeAdminMain(null),
  );
  const [webScss, setWebScss] = React.useState("");
  const [adminScss, setAdminScss] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [advOpen, setAdvOpen] = React.useState(false);

  function applyDoc(doc: Record<string, unknown>) {
    const ut = doc.uiTheme as
      | {
          webMain?: Record<string, string>;
          adminMain?: Record<string, string>;
          webScss?: string;
          adminScss?: string;
        }
      | undefined;
    setWebMain(mergeWebMain(ut?.webMain ?? null));
    setAdminMain(mergeAdminMain(ut?.adminMain ?? null));
    setWebScss(typeof ut?.webScss === "string" ? ut.webScss : "");
    setAdminScss(typeof ut?.adminScss === "string" ? ut.adminScss : "");
  }

  async function load() {
    const t = token();
    if (!t) return;
    setLoading(true);
    try {
      const doc = (await getBusinessSettings(t)) as Record<string, unknown>;
      applyDoc(doc);
    } catch (e: unknown) {
      toast({
        title: "Không tải được theme",
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
    const t = token();
    if (!t) return;
    setSaving(true);
    try {
      const res = (await patchBusinessSettings(
        {
          uiTheme: {
            webMain,
            adminMain,
            webScss,
            adminScss,
          },
        },
        t,
      )) as Record<string, unknown>;
      applyDoc(res);
      toast({ title: "Đã lưu theme" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("admin-theme-updated"));
      }
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

  function setWebKey(key: string, v: string) {
    setWebMain((prev) => ({ ...prev, [key]: v }));
  }
  function setAdminKey(key: string, v: string) {
    setAdminMain((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Themes"
          description="Chỉnh màu site (người chơi) và admin; SCSS nâng cao chỉ lưu chuỗi — biên dịch SCSS cần pipeline riêng."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={load} disabled={loading || saving} variant="outline">
            Tải lại
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>

        <Tabs defaultValue="web" className="mt-6 w-full">
          <TabsList>
            <TabsTrigger value="web">Site (người chơi)</TabsTrigger>
            <TabsTrigger value="admin">Admin dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="web" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme main — biến CSS `--app-ui-*`</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto pr-1">
                {WEB_KEYS.map((k) => (
                  <ColorRow
                    key={k}
                    k={k}
                    value={webMain[k] ?? ""}
                    onChange={(v) => setWebKey(k, v)}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="admin" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin — biến `--adm-*`</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto pr-1">
                {ADMIN_KEYS.map((k) => (
                  <ColorRow
                    key={k}
                    k={k}
                    value={adminMain[k] ?? ""}
                    onChange={(v) => setAdminKey(k, v)}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium"
            onClick={() => setAdvOpen((o) => !o)}
          >
            Advanced configuration (SCSS)
            <ChevronDown
              className={`size-4 transition-transform ${advOpen ? "rotate-180" : ""}`}
            />
          </button>
          {advOpen ? (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <Label className="text-xs">Web / site (tuỳ chỉnh SCSS — lưu nguyên văn)</Label>
                <Textarea
                  className="mt-1 min-h-[160px] font-mono text-xs"
                  placeholder={DEFAULT_SCSS_PLACE}
                  value={webScss}
                  onChange={(e) => setWebScss(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Admin dashboard</Label>
                <Textarea
                  className="mt-1 min-h-[160px] font-mono text-xs"
                  placeholder={DEFAULT_SCSS_ADMIN}
                  value={adminScss}
                  onChange={(e) => setAdminScss(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Hai ô trên chỉ lưu trong DB; không tự compile. Dùng export/build pipeline nếu cần sinh CSS.
              </p>
            </CardContent>
          ) : null}
        </Card>

        <AdminRelatedLinks
          className="mt-6"
          links={[
            {
              to: "/vip-program",
              label: "Chương trình VIP (Level 0–8)",
            },
            {
              to: "/vip-level",
              label: "Cấp VIP theo bậc",
            },
            {
              to: "/setting/site",
              label: "Cài đặt site",
            },
          ]}
        />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
