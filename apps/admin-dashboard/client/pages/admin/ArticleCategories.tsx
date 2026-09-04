import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  createArticleCategory,
  deleteArticleCategory,
  listArticleCategories,
  patchArticleCategory,
  type ArticleCategory,
} from "@/lib/api";
import * as React from "react";

const tk = () => getAdminToken() || "";

export default function ArticleCategoriesPage() {
  const [rows, setRows] = React.useState<ArticleCategory[]>([]);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listArticleCategories(tk());
      setRows((data as any)?.items || []);
    } catch (e: any) {
      toast({ title: "Tải chuyên mục thất bại", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function addCategory() {
    if (!name.trim()) return;
    try {
      await createArticleCategory({ name, slug }, tk());
      setName("");
      setSlug("");
      await load();
      toast({ title: "Đã tạo chuyên mục" });
    } catch (e: any) {
      toast({ title: "Tạo chuyên mục thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Chuyên mục bài viết</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tạo chuyên mục mới</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Tên</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Slug (tuỳ chọn)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={addCategory}>Thêm</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách chuyên mục ({rows.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row) => (
                <div key={row._id} className="grid gap-2 rounded border p-3 md:grid-cols-6">
                  <Input
                    className="md:col-span-2"
                    value={row.name}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x._id === row._id ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <Input
                    value={row.slug}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x._id === row._id ? { ...x, slug: e.target.value } : x)))
                    }
                  />
                  <Input
                    type="number"
                    value={row.order}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x._id === row._id ? { ...x, order: Number(e.target.value) } : x)))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.status}
                      onCheckedChange={(v) =>
                        setRows((prev) => prev.map((x) => (x._id === row._id ? { ...x, status: v } : x)))
                      }
                    />
                    <span className="text-sm">Bật</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await patchArticleCategory(row._id, row, tk());
                        toast({ title: "Đã lưu chuyên mục" });
                        await load();
                      }}
                    >
                      Lưu
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteArticleCategory(row._id, tk());
                        toast({ title: "Đã xoá chuyên mục" });
                        await load();
                      }}
                    >
                      Xoá
                    </Button>
                  </div>
                </div>
              ))}
              {!rows.length && !loading && <div className="text-sm text-muted-foreground">Chưa có chuyên mục</div>}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
