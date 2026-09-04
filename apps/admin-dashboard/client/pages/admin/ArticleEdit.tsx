import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@game/ui/select";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getArticlePost,
  listArticleCategories,
  patchArticlePost,
  type ArticleCategory,
  uploadSettingBannerAsset,
} from "@/lib/api";
import * as React from "react";
import { useParams } from "react-router-dom";

const tk = () => getAdminToken() || "";

export default function ArticleEditPage() {
  const { id = "" } = useParams();
  const [categories, setCategories] = React.useState<ArticleCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<any>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [post, cats] = await Promise.all([getArticlePost(id, tk()), listArticleCategories(tk())]);
      setForm({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        contentHtml: post.contentHtml || "",
        thumbnail: post.thumbnail || "",
        categoryId: post.categoryId || "",
        status: post.status || "draft",
        featured: Boolean(post.featured),
      });
      setCategories((cats as any)?.items || []);
    } catch (e: any) {
      toast({ title: "Load bài viết thất bại", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, [id]);

  if (loading || !form) {
    return (
      <RequireSuperAdmin>
        <AdminLayout>
          <div>Đang tải...</div>
        </AdminLayout>
      </RequireSuperAdmin>
    );
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Sửa bài viết</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? "Ẩn preview" : "Xem preview"}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await patchArticlePost(id, form, tk());
                    toast({ title: "Đã cập nhật bài viết" });
                  } catch (e: any) {
                    toast({ title: "Lưu thất bại", description: e?.message || "", variant: "destructive" });
                  }
                }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trình chỉnh sửa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Tiêu đề</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Tóm tắt</Label>
                  <Textarea rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Nội dung HTML</Label>
                  <Textarea rows={12} value={form.contentHtml} onChange={(e) => setForm({ ...form, contentHtml: e.target.value })} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Thumbnail</Label>
                    <Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const res = await uploadSettingBannerAsset(tk(), file);
                        setForm((p: any) => ({ ...p, thumbnail: res.filename }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chuyên mục</Label>
                    <Select value={form.categoryId || "__none__"} onValueChange={(v) => setForm({ ...form, categoryId: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn chuyên mục" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Không chọn</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Nháp</SelectItem>
                        <SelectItem value="published">Xuất bản</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                      <span className="text-sm">Nổi bật</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Xem trước</CardTitle>
              </CardHeader>
              <CardContent>
                {showPreview ? (
                  <div className="space-y-3">
                    {form.thumbnail ? <img src={form.thumbnail.startsWith("http") ? form.thumbnail : `/${form.thumbnail}`} alt="" className="max-h-60 w-full rounded object-cover" /> : null}
                    <h2 className="text-xl font-bold">{form.title}</h2>
                    <p className="text-sm text-muted-foreground">{form.excerpt}</p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: form.contentHtml || "" }} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Bật "Xem preview" để xem nội dung render.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
