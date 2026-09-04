import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@game/ui/table";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import {
  approveVnDomesticDeposit,
  getDepositItem,
  listDeposits,
  rejectVnDomesticDeposit,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { useEffect, useMemo, useState } from "react";

export type ManualMode = "pending" | "accepted" | "rejected";

function modeToStatus(mode: ManualMode): string {
  if (mode === "pending") return "pending";
  if (mode === "accepted") return "success";
  return "failed";
}

function modeTitle(mode: ManualMode): string {
  if (mode === "pending") return "Thanh toán tay chờ xử lý";
  if (mode === "accepted") return "Thanh toán tay đã chấp nhận";
  return "Thanh toán tay đã từ chối";
}

export default function ManualPaymentsPage({ mode }: { mode: ManualMode }) {
  const token = useMemo(() => getAdminToken() || "", []);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await listDeposits(
        {
          status: modeToStatus(mode),
          payinType: "vn_domestic",
          currentPage: 1,
          rowsPerPage: 100,
          isAll: true,
        },
        token,
      );
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      toast({
        title: "Tải dữ liệu thất bại",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(row: any) {
    setSelected(row);
    setActualAmount(Number(row?.amount || 0));
    setComment("");
    setRejectReason("");
    try {
      const d = await getDepositItem({ orderId: row._id, payinType: "vn_domestic" }, token);
      setDetail(d);
    } catch {
      setDetail(row);
    }
  }

  async function approve() {
    if (!selected?._id) return;
    try {
      await approveVnDomesticDeposit(
        { depositId: selected._id, comment, actuallyAmount: Number(actualAmount || 0) },
        token,
      );
      toast({ title: "Đã duyệt lệnh nạp tay" });
      await load();
      setSelected(null);
      setDetail(null);
    } catch (e: any) {
      toast({
        title: "Duyệt thất bại",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  async function reject() {
    if (!selected?._id || !rejectReason.trim()) return;
    try {
      await rejectVnDomesticDeposit(
        { depositId: selected._id, reason: rejectReason.trim() },
        token,
      );
      toast({ title: "Đã từ chối lệnh nạp tay" });
      await load();
      setSelected(null);
      setDetail(null);
    } catch (e: any) {
      toast({
        title: "Từ chối thất bại",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    load();
  }, [mode]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">{modeTitle(mode)}</h1>
            <p className="text-sm text-muted-foreground">
              Nguồn dữ liệu: <code className="rounded bg-muted px-1 text-xs">/api/deposit/list</code> với payinType=
              <code className="rounded bg-muted px-1 text-xs">vn_domestic</code>
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Đang tải..." : "Làm mới"}
          </Button>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Danh sách lệnh</CardTitle>
            <CardDescription>Chọn 1 dòng để xem chi tiết và thao tác.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lệnh</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row._id} className="cursor-pointer" onClick={() => loadDetail(row)}>
                    <TableCell className="font-mono text-xs">{row._id}</TableCell>
                    <TableCell>{row?.user?.username || "-"}</TableCell>
                    <TableCell>{Number(row.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "success"
                            ? "default"
                            : row.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!items.length && <p className="py-8 text-center text-muted-foreground">Không có dữ liệu.</p>}
          </CardContent>
        </Card>

        {selected && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Chi tiết lệnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">Mã: <code className="rounded bg-muted px-1 text-xs">{selected._id}</code></p>
              <p className="text-sm">User: <strong>{selected?.user?.username || "-"}</strong></p>
              <p className="text-sm">Mô tả: {detail?.description || selected?.description || "-"}</p>
              <p className="text-sm">Nội dung CK: {detail?.data?.transferContent || selected?.data?.transferContent || "-"}</p>

              {mode === "pending" && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Số tiền xác nhận</Label>
                    <Input
                      type="number"
                      value={actualAmount}
                      onChange={(e) => setActualAmount(Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Ghi chú duyệt</Label>
                    <Input value={comment} onChange={(e) => setComment(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Lý do từ chối</Label>
                    <Textarea rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <Button onClick={approve}>Duyệt</Button>
                    <Button variant="destructive" onClick={reject}>Từ chối</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
