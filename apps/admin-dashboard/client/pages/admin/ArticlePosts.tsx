import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@game/ui/select";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  deleteArticlePost,
  listArticleCategories,
  listArticlePosts,
  patchArticlePost,
  type ArticleCategory,
  type ArticlePost,
} from "@/lib/api";
import * as React from "react";
import { Link } from "react-router-dom";

const tk = () => getAdminToken() || "";

export default function ArticlePostsPage() {
  const [items, setItems] = React.useState<ArticlePost[]>([]);
  const [categories, setCategories] = React.useState<ArticleCategory[]>([]);
  const [status, setStatus] = React.useState<"all" | "draft" | "published">("all");
  const [category, setCategory] = React.useState("");
  const [keyword, setKeyword] = React.useState("");

  async function load() {
    try {
      const [postRes, catRes] = await Promise.all([
        listArticlePosts(tk(), { status, category, keyword, limit: 100 }),
        listArticleCategories(tk()),
      ]);
      setItems(postRes.items || []);
      setCategories((catRes as any)?.items || []);
    } catch (e: any) {
      toast({ title: "Load bài viết thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  React.useEffect(() => {
    void load();
  }, [status, category]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Tất cả bài viết</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Input placeholder="Tìm tiêu đề/slug..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="published">Xuất bản</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Chuyên mục" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả chuyên mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={load}>Tìm</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((row) => (
                <div key={row._id} className="rounded border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{row.title}</div>
                    <span className="text-xs text-muted-foreground">{row.slug}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">{row.status}</span>
                    {row.featured && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">nổi bật</span>}
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" asChild>
                        <Link to={`/articles/${row._id}/edit`}>Sửa</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await patchArticlePost(row._id, { status: row.status === "published" ? "draft" : "published" }, tk());
                          await load();
                        }}
                      >
                        {row.status === "published" ? "Chuyển nháp" : "Xuất bản"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          await deleteArticlePost(row._id, tk());
                          toast({ title: "Đã xoá bài viết" });
                          await load();
                        }}
                      >
                        Xoá
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!items.length && <div className="text-sm text-muted-foreground">Chưa có bài viết</div>}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
