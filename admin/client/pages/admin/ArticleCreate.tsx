import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  createArticlePost,
  listArticleCategories,
  type ArticleCategory,
  uploadSettingBannerAsset,
} from "@/lib/api";
import * as React from "react";

const tk = () => getAdminToken() || "";

export default function ArticleCreatePage() {
  const [categories, setCategories] = React.useState<ArticleCategory[]>([]);
  const [form, setForm] = React.useState({
    title: "",
    slug: "",
    excerpt: "",
    contentHtml: "",
    thumbnail: "",
    categoryId: "",
    status: "draft" as "draft" | "published",
    featured: false,
  });

  React.useEffect(() => {
    listArticleCategories(tk())
      .then((res: any) => setCategories(res?.items || []))
      .catch(() => undefined);
  }, []);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Viết bài mới</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin bài viết</CardTitle>
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
                      setForm((p) => ({ ...p, thumbnail: res.filename }));
                    }}
                  />
                </div>
                <div className="space-y-1">
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
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                    <span className="text-sm">Nổi bật</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant={form.status === "draft" ? "default" : "outline"} onClick={() => setForm({ ...form, status: "draft" })}>Nháp</Button>
                <Button variant={form.status === "published" ? "default" : "outline"} onClick={() => setForm({ ...form, status: "published" })}>Xuất bản</Button>
                <Button
                  className="ml-auto"
                  onClick={async () => {
                    try {
                      await createArticlePost(form, tk());
                      toast({ title: "Đã tạo bài viết" });
                      setForm({
                        title: "",
                        slug: "",
                        excerpt: "",
                        contentHtml: "",
                        thumbnail: "",
                        categoryId: "",
                        status: "draft",
                        featured: false,
                      });
                    } catch (e: any) {
                      toast({ title: "Tạo bài thất bại", description: e?.message || "", variant: "destructive" });
                    }
                  }}
                >
                  Lưu bài viết
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
