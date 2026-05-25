import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteNewsletterApi,
  listNewsletterApi,
  newsletterCsvUrl,
  patchNewsletterApi,
  type NewsletterRow,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Download, Mail, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 50;

export default function NewsletterSubscribersPage() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [items, setItems] = useState<NewsletterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [confirmDel, setConfirmDel] = useState<NewsletterRow | null>(null);

  async function reload(p = page) {
    setLoading(true);
    try {
      const r = await listNewsletterApi(
        { keyword, status: status === "all" ? "" : status, page: p, limit: PAGE_SIZE },
        token,
      );
      setItems(r.items || []);
      setTotal(r.total || 0);
      setActiveCount(r.activeCount || 0);
      setPage(r.page || p);
    } catch (e: any) {
      toast({ title: "Lỗi tải subscriber", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(1); /* eslint-disable-next-line */ }, [status]);

  async function toggleStatus(it: NewsletterRow) {
    const next = it.status === "active" ? "unsubscribed" : "active";
    try {
      await patchNewsletterApi(it._id, { status: next }, token);
      reload(page);
    } catch (e: any) {
      toast({ title: "Lỗi cập nhật", description: e?.message, variant: "destructive" });
    }
  }
  function downloadCsv() {
    const url = newsletterCsvUrl(status === "all" ? undefined : status);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Mail className="size-6" /> Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground">Danh sách email đăng ký nhận thông báo & ưu đãi.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => reload(page)} disabled={loading}>
            <RefreshCw className="mr-2 size-4" /> Làm mới
          </Button>
          <Button size="sm" onClick={downloadCsv}>
            <Download className="mr-2 size-4" /> Xuất CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tổng</p>
            <p className="text-2xl font-semibold">{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Đang nhận tin</p>
            <p className="text-2xl font-semibold text-green-600">{activeCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Đã hủy</p>
            <p className="text-2xl font-semibold text-muted-foreground">{(total - activeCount).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm kiếm và lọc danh sách</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-60">
              <Label className="text-xs">Tìm theo email</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="email…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reload(1)}
                />
              </div>
            </div>
            <div className="w-44">
              <Label className="text-xs">Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang nhận</SelectItem>
                  <SelectItem value="unsubscribed">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => reload(1)}>Tìm</Button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Đăng ký lúc</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it._id}>
                    <TableCell className="font-medium">{it.email}</TableCell>
                    <TableCell>
                      <Badge variant={it.status === "active" ? "default" : "outline"}>{it.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{it.source || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{it.ip || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {it.createdAt ? format(new Date(it.createdAt), "dd/MM/yy HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(it)}>
                        {it.status === "active" ? "Hủy" : "Kích hoạt"}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDel(it)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      {loading ? "Đang tải…" : "Chưa có subscriber"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted-foreground">Trang {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
            <div className="space-x-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => reload(page - 1)}>Trước</Button>
              <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => reload(page + 1)}>Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa vĩnh viễn email <strong>{confirmDel?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDel) return;
                try {
                  await deleteNewsletterApi(confirmDel._id, token);
                  toast({ title: "Đã xóa" });
                  setConfirmDel(null);
                  reload(page);
                } catch (e: any) {
                  toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
                }
              }}
            >Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
