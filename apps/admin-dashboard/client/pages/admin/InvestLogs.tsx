import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@game/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@game/ui/table";
import { toast } from "@game/ui/use-toast";
import { getAdminInvestLogs } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { format } from "date-fns";
import { BarChart3, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@game/ui/input";

const PAGE_SIZE = 20;

export default function InvestLogsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trxId, setTrxId] = useState("");
  const [userId, setUserId] = useState("");

  async function reload(p: number) {
    const token = getAdminToken() || "";
    if (!token) {
      setError("Chưa đăng nhập admin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await getAdminInvestLogs(token, {
        page: p,
        limit: PAGE_SIZE,
        trxId: trxId.trim() || undefined,
        userId: userId.trim() || undefined,
      });
      if (!r?.success) throw new Error("Phản hồi API không hợp lệ");
      setItems(r.data?.results || []);
      setTotal(Number(r.data?.totalResults ?? 0));
      setPage(p);
    } catch (e: any) {
      const msg = e?.message || "Lỗi tải dữ liệu";
      setError(msg);
      toast({ title: "Lỗi tải log", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <BarChart3 className="size-6" /> Nhật ký đầu tư
            </h1>
            <p className="text-sm text-muted-foreground">
              Đầu tư đại lý / reagent — dữ liệu từ API admin.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => reload(page)} disabled={loading}>
            <RefreshCw className="mr-2 size-4" /> Làm mới
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="mt-4">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Danh sách</CardTitle>
                <CardDescription>Tổng cộng: {total}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Mã giao dịch (trxId)"
                  className="h-9 w-48 sm:w-56"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reload(1)}
                />
                <Input
                  placeholder="UserId (Mongo)"
                  className="h-9 w-48 sm:w-56"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reload(1)}
                />
                <Button size="sm" onClick={() => reload(1)}>
                  <Search size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Trx</TableHead>
                    <TableHead>UserId</TableHead>
                    <TableHead>Cổng</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Thù lao</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thanh toán tiếp</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it: any) => (
                    <TableRow key={it.id || it._id}>
                      <TableCell className="font-mono text-xs">{it.trxId}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {typeof it.userId === "object" && it.userId?._id
                          ? String(it.userId._id)
                          : String(it.userId ?? "")}
                      </TableCell>
                      <TableCell className="text-xs font-bold uppercase">{it.gateway}</TableCell>
                      <TableCell className="text-right font-bold">
                        {Number(it.amount).toLocaleString()} {it.currency}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-500">
                        +{Number(it.remuneration ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs capitalize">{it.status ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {it.nextPayoutDate ? format(new Date(it.nextPayoutDate), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {it.createdAt ? format(new Date(it.createdAt), "dd/MM HH:mm") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                        {loading ? "Đang tải…" : "Không tìm thấy dữ liệu"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">
                Trang {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
              </span>
              <div className="space-x-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => reload(page - 1)}>
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * PAGE_SIZE >= total}
                  onClick={() => reload(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
