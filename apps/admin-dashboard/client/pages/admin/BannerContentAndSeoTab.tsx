import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import {
  getBusinessSettings,
  patchBusinessSettings,
  uploadSettingBannerAsset,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import * as React from "react";
import { FileText, Save } from "lucide-react";

const token = () => getAdminToken() || "";

const envBase = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
const lsBase =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("__API_BASE")
    : null;
const winBase = (typeof window !== "undefined" && (window as any).__API_BASE) || undefined;
const originApi =
  typeof window !== "undefined" ? `${window.location.origin}/api` : undefined;
const API_BASE =
  (lsBase && lsBase.trim()) || winBase || (envBase && envBase.trim()) || originApi || "/api";
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, "");

type Hero = {
  enabled: boolean;
  title: string;
  image: string;
  contentHtml: string;
};

type Og = {
  title: string;
  image: string;
  description: string;
};

const defaultHero: Hero = {
  enabled: false,
  title: "Banner Title",
  image: "",
  contentHtml: "",
};

const defaultOg: Og = {
  title: "",
  image: "",
  description:
    "This will be seen in social networks when someone shares a link to the website.",
};

function previewImg(src: string) {
  if (!src?.trim()) return "/images/news/default.webp";
  if (/^https?:\/\//i.test(src)) return src;
  return `${ASSET_HOST}/${src.replace(/^\//, "")}`;
}

export default function BannerContentAndSeoTab() {
  const [loading, setLoading] = React.useState(true);
  const [savingHero, setSavingHero] = React.useState(false);
  const [savingOg, setSavingOg] = React.useState(false);
  const [hero, setHero] = React.useState<Hero>(defaultHero);
  const [og, setOg] = React.useState<Og>(defaultOg);

  async function load() {
    const t = token();
    if (!t) return;
    setLoading(true);
    try {
      const doc = await getBusinessSettings(t);
      setHero({ ...defaultHero, ...(doc?.heroBanner || {}) });
      setOg({ ...defaultOg, ...(doc?.openGraph || {}) });
    } catch (e: any) {
      toast({
        title: "Không tải được cấu hình",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function uploadHeroImage(file: File) {
    const t = token();
    if (!t) return;
    try {
      const { filename } = await uploadSettingBannerAsset(t, file);
      setHero((h) => ({ ...h, image: filename }));
      toast({ title: "Đã upload ảnh", description: filename });
    } catch (e: any) {
      toast({
        title: "Upload lỗi",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  async function uploadOgImage(file: File) {
    const t = token();
    if (!t) return;
    try {
      const { filename } = await uploadSettingBannerAsset(t, file);
      setOg((o) => ({ ...o, image: filename }));
      toast({ title: "Đã upload ảnh OG", description: filename });
    } catch (e: any) {
      toast({
        title: "Upload lỗi",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  async function saveHero() {
    const t = token();
    if (!t) return;
    setSavingHero(true);
    try {
      await patchBusinessSettings({ heroBanner: hero }, t);
      toast({ title: "Đã lưu banner nội dung" });
      await load();
    } catch (e: any) {
      toast({
        title: "Lưu lỗi",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setSavingHero(false);
    }
  }

  async function saveOg() {
    const t = token();
    if (!t) return;
    setSavingOg(true);
    try {
      await patchBusinessSettings({ openGraph: og }, t);
      toast({ title: "Đã lưu Open Graph" });
      await load();
    } catch (e: any) {
      toast({
        title: "Lưu lỗi",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setSavingOg(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Banner nội dung</CardTitle>
          <CardDescription>
            Tiêu đề, ảnh và HTML hiển thị phía trên carousel trang chủ khi bật Enabled (GET /setting/site →
            site.heroBanner).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Edit</div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="hero-en">Enabled</Label>
              <Switch
                id="hero-en"
                checked={hero.enabled}
                onCheckedChange={(v) => setHero((h) => ({ ...h, enabled: v }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                placeholder="Title"
                value={hero.title}
                onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Image"
                  value={hero.image}
                  onChange={(e) => setHero((h) => ({ ...h, image: e.target.value }))}
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <FileText className="mr-1 h-4 w-4" />
                  File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadHeroImage(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Content"
                rows={10}
                value={hero.contentHtml}
                onChange={(e) => setHero((h) => ({ ...h, contentHtml: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Cho phép HTML (liên kết, định dạng cơ bản). Hiển thị cho mọi người sau khi tải trang.
              </p>
            </div>
            <Button disabled={loading || savingHero} onClick={saveHero}>
              <Save className="mr-2 h-4 w-4" />
              Lưu banner nội dung
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Preview</div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <img
                src={previewImg(hero.image)}
                alt=""
                className="mb-3 max-h-48 w-full rounded-md object-cover"
              />
              <div className="text-lg font-semibold">{hero.title || "Banner Title"}</div>
              <div
                className="prose prose-sm mt-2 max-w-none text-muted-foreground dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html:
                    hero.contentHtml ||
                    "<p>This text will show for everyone after page is loaded.</p><p><a href=\"https://example.com\">You can insert links</a> and other HTML elements.</p>",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open Graph</CardTitle>
          <CardDescription>
            Hiển thị khi chia sẻ link (Facebook, Twitter…). Meta tag từ site.openGraph.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Edit</div>
            <div className="grid gap-2">
              <Label>Tiêu đề (social)</Label>
              <Input
                placeholder="Phoenix"
                value={og.title}
                onChange={(e) => setOg((o) => ({ ...o, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ảnh (social networks)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Image (for social networks)"
                  value={og.image}
                  onChange={(e) => setOg((o) => ({ ...o, image: e.target.value }))}
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <FileText className="mr-1 h-4 w-4" />
                  File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadOgImage(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Mô tả</Label>
              <Textarea
                rows={4}
                value={og.description}
                onChange={(e) => setOg((o) => ({ ...o, description: e.target.value }))}
              />
            </div>
            <Button disabled={loading || savingOg} onClick={saveOg}>
              <Save className="mr-2 h-4 w-4" />
              Lưu Open Graph
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Preview</div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <img
                src={previewImg(og.image)}
                alt=""
                className="mb-3 max-h-40 w-full rounded-md object-cover"
              />
              <div className="text-lg font-semibold">{og.title || "Phoenix"}</div>
              <p className="mt-1 text-sm text-muted-foreground">{og.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
