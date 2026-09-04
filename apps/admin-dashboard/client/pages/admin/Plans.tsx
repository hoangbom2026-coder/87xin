import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@game/ui/select";
import { Switch } from "@game/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@game/ui/table";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { duplicatePlan, getPlans, patchPlanStatus, type IPlanAdmin } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function PlansAdmin() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [rows, setRows] = useState<IPlanAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getPlans(token, { status, keyword, page, limit });
      if (Array.isArray(data)) {
        setRows(data);
        setTotal(data.length);
      } else {
        setRows(data.items || []);
        setTotal(Number(data.total || 0));
      }
    } catch (e: any) {
      toast({ title: "Không tải được sản phẩm", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [page, limit, status]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Tất cả các sản phẩm</h1>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/admin/plans/new">Thêm sản phẩm</Link>
              </Button>
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                Làm mới
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách gói đầu tư / sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-4">
              <Input
                placeholder="Tìm theo tên/mô tả..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setPage(1); void load(); }}>Tìm</Button>
            </CardContent>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sl.</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Giới hạn đầu tư</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hoạt động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row._id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        {row.amountType === 0
                          ? `${Number(row.minimum || 0).toLocaleString()} USD - ${Number(row.maximum || 0).toLocaleString()} USD`
                          : `${Number(row.amount || 0).toLocaleString()} USD`}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={row.status === "active"}
                          onCheckedChange={async (v) => {
                            try {
                              await patchPlanStatus(row._id, v ? "active" : "inactive", token);
                              await load();
                            } catch (e: any) {
                              toast({ title: "Đổi trạng thái thất bại", description: e?.message || "", variant: "destructive" });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link to={`/admin/plans/${row._id}/edit`}>Biên tập</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await duplicatePlan(row._id, token);
                                toast({ title: "Đã copy sản phẩm" });
                                await load();
                              } catch (e: any) {
                                toast({ title: "Copy thất bại", description: e?.message || "", variant: "destructive" });
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Tổng: {total}</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trước
                  </Button>
                  <span>Trang {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
              {!rows.length && !loading && <div className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu</div>}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
