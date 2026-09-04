import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

import { getAdminToken } from "@/lib/adminAuth";
import {
  approveWithdrawal,
  createAdminWithdraw,
  declineWithdrawal,
  getPendingWithdrawals,
  getWithdrawalItem,
  listWithdrawals,
} from "@/lib/api";

const adminToken = () => getAdminToken() || "";

export default function WithdrawalsTab() {
  const [status, setStatus] = React.useState<string>("all");
  const [username, setUsername] = React.useState<string>("");
  const [isAll, setIsAll] = React.useState<boolean>(true);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(20);
  const [startDate, setStartDate] = React.useState<Date>(new Date(Date.now() - 7 * 864e5));
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState<number>(0);

  const [pending, setPending] = React.useState<any | null>(null);

  const [itemUserId, setItemUserId] = React.useState<string>("");
  const [orderId, setOrderId] = React.useState<string>("");
  const [payoutType, setPayoutType] = React.useState<string>("nowpayment");
  const [itemDetail, setItemDetail] = React.useState<any | null>(null);

  const [approveId, setApproveId] = React.useState<string>("");
  const [declineId, setDeclineId] = React.useState<string>("");
  const [declineReason, setDeclineReason] = React.useState<string>("");

  const [creating, setCreating] = React.useState(false);
  const [createUserId, setCreateUserId] = React.useState("");
  const [createAmount, setCreateAmount] = React.useState<number>(0);
  const [createComment, setCreateComment] = React.useState("");

  async function loadList(opts?: { page?: number; silent?: boolean }) {
    const page = opts?.page ?? currentPage;
    try {
      const body: any = { status, username, currentPage: page, rowsPerPage, isAll };
      if (!isAll) body.date = { start: startDate.toISOString(), end: endDate.toISOString() };
      const data: any = await listWithdrawals(body, adminToken());
      setItems(data?.data || []);
      setTotal(data?.total || 0);
      if (!opts?.silent) toast({ title: "Đã tải rút tiền" });
    } catch (e: any) {
      toast({ title: "Tải dữ liệu thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  async function loadPending() {
    try {
      const data = await getPendingWithdrawals(adminToken());
      setPending(data);
      toast({ title: "Đã tải danh sách chờ xử lý" });
    } catch (e: any) {
      setPending(null);
      toast({ title: "Không có yêu cầu chờ xử lý" });
    }
  }

  async function fetchItem() {
    if (!itemUserId || !orderId || !payoutType) return;
    try {
      const data = await getWithdrawalItem({ userId: itemUserId, orderId, payoutType }, adminToken());
      setItemDetail(data);
      toast({ title: "Đã tải chi tiết rút tiền" });
    } catch (e: any) {
      setItemDetail(null);
      toast({ title: "Tải dữ liệu thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  async function approve(id?: string) {
    const wid = id || approveId;
    if (!wid) return;
    try {
      await approveWithdrawal(wid, adminToken());
      toast({ title: "Đã duyệt" });
      setApproveId("");
      await loadList({ silent: true });
    } catch (e: any) {
      toast({ title: "Duyệt thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  async function decline(id?: string, reason?: string) {
    const wid = id || declineId;
    const desc = typeof reason === "string" ? reason : declineReason;
    if (!wid || !desc) return;
    try {
      await declineWithdrawal(wid, desc, adminToken());
      toast({ title: "Đã từ chối" });
      setDeclineId("");
      setDeclineReason("");
      await loadList({ silent: true });
    } catch (e: any) {
      toast({ title: "Từ chối thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  async function onSubmitAdminWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!createUserId || !createAmount) return;
    setCreating(true);
    try {
      await createAdminWithdraw({ userId: createUserId, amount: createAmount, comment: createComment }, adminToken());
      toast({ title: "Đã tạo yêu cầu rút tiền (admin)" });
      setCreateUserId(""); setCreateAmount(0); setCreateComment("");
      await loadList({ silent: true });
    } catch (e: any) {
      toast({ title: "Tạo thất bại", description: e?.message || "", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  React.useEffect(() => {
    if (adminToken()) loadList({ page: 1, silent: true });
  }, []);

  function labelize(key: string) {
    return key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  }
  function isIsoDateString(v: any) {
    return typeof v === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v);
  }
  function formatValue(v: any): any {
    if (v === null || typeof v === "undefined") return "-";
    if (typeof v === "boolean") return v ? "Có" : "Không";
    if (typeof v === "number") return new Intl.NumberFormat().format(v);
    if (typeof v === "string") return isIsoDateString(v) ? new Date(v).toLocaleString() : v;
    if (Array.isArray(v)) return `${v.length} mục`;
    if (typeof v === "object") return "(object)";
    return String(v);
  }
  function RenderDetails({ value }: { value: any }) {
    if (Array.isArray(value)) {
      return (
        <div className="grid gap-1">
          {value.map((it, idx) => (
            <div key={idx} className="rounded border p-2 text-xs">
              <RenderDetails value={it} />
            </div>
          ))}
        </div>
      );
    }
    if (value && typeof value === "object") {
      return (
        <div className="grid gap-1">
          {Object.entries(value as Record<string, any>).map(([k, v]) => (
            <div key={k} className="grid gap-0.5">
              <div className="text-xs text-muted-foreground">{labelize(k)}</div>
              <div className="text-sm break-all">{typeof v === "object" ? <RenderDetails value={v} /> : formatValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-sm">{formatValue(value)}</span>;
  }

  const pages = Math.max(1, Math.ceil(total / rowsPerPage));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle>Rút tiền</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Trạng thái</div>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="process">Đang xử lý</SelectItem>
                  <SelectItem value="payoutPending">Chờ chi trả</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="declined">Từ chối</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tên đăng nhập</div>
              <Input className="h-9 w-48" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="không bắt buộc" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Số dòng</div>
              <Input className="h-9 w-24" type="number" value={rowsPerPage} onChange={(e) => setRowsPerPage(Math.max(1, Number(e.target.value) || 20))} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Trang</div>
              <Input className="h-9 w-24" type="number" value={currentPage} onChange={(e) => setCurrentPage(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Từ ngày</div>
              <Input className="h-9 w-full sm:w-56" type="date" value={startDate.toISOString().slice(0,10)} onChange={(e)=>{ const v=e.target.value; if (v) setStartDate(new Date(`${v}T00:00:00`)); }} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Đến ngày</div>
              <Input className="h-9 w-full sm:w-56" type="date" value={endDate.toISOString().slice(0,10)} onChange={(e)=>{ const v=e.target.value; if (v) setEndDate(new Date(`${v}T00:00:00`)); }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Tất cả thời gian</div>
              <Switch checked={isAll} onCheckedChange={(v) => setIsAll(Boolean(v))} />
            </div>
            <Button
              onClick={() => {
                setCurrentPage(1);
                loadList({ page: 1 });
              }}
            >
              Tìm kiếm
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => {
                  const p = Math.max(1, currentPage - 1);
                  setCurrentPage(p);
                  loadList({ page: p, silent: true });
                }}
              >
                Trước
              </Button>
              <div className="text-sm text-muted-foreground">{currentPage} / {pages}</div>
              <Button
                variant="outline"
                disabled={currentPage >= pages}
                onClick={() => {
                  const p = currentPage + 1;
                  setCurrentPage(p);
                  loadList({ page: p, silent: true });
                }}
              >
                Sau
              </Button>
            </div>
          </div>

          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Tiền tệ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d: any) => (
                  <TableRow key={d._id}>
                    <TableCell className="font-mono text-xs">{d._id}</TableCell>
                    <TableCell>{d.user?.username || d.userId}</TableCell>
                    <TableCell>${Number(d.amount).toFixed(2)}</TableCell>
                    <TableCell>{d.currency}</TableCell>
                    <TableCell>{d.status}</TableCell>
                    <TableCell>{d.payoutType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="space-x-2 whitespace-nowrap">
                      {d.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => approve(d._id)}>Duyệt</Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const reason = window.prompt("Lý do từ chối?") || "";
                            if (reason) decline(d._id, reason);
                          }}>Từ chối</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader><CardTitle>Rút tiền đang chờ của tôi</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button onClick={loadPending}>Xem danh sách chờ</Button>
            {Array.isArray(pending) ? (
              pending.length ? (
                <div className="grid gap-2">
                  {pending.map((p: any) => (
                    <div key={p._id} className="rounded border p-2 text-sm">
                      <div className="font-mono text-xs mb-1">{p._id}</div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span>${Number(p.amount || 0).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{p.currency || ""}</span>
                        <span className="text-xs text-muted-foreground">{p.status}</span>
                        <span className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Không có dữ liệu</div>
              )
            ) : pending ? (
              <div className="rounded border p-2 text-sm"><RenderDetails value={pending} /></div>
            ) : (
              <div className="text-sm text-muted-foreground">Không có dữ liệu</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Duyệt / Từ chối</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex gap-2">
                <Input placeholder="withdrawId" value={approveId} onChange={(e) => setApproveId(e.target.value)} />
                <Button onClick={() => approve()}>Duyệt</Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="withdrawId" value={declineId} onChange={(e) => setDeclineId(e.target.value)} />
                <Input placeholder="lý do" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
                <Button variant="destructive" onClick={() => decline()}>Từ chối</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Chi tiết rút tiền</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Input placeholder="userId" value={itemUserId} onChange={(e) => setItemUserId(e.target.value)} />
            <Input placeholder="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Select value={payoutType} onValueChange={(v) => setPayoutType(v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="payoutType" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nowpayment">nowpayment</SelectItem>
                <SelectItem value="agpayment">agpayment</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchItem}>Tải</Button>
            {itemDetail ? (
              <div className="rounded border p-2 text-sm">
                <RenderDetails value={itemDetail} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tạo yêu cầu rút tiền (admin)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmitAdminWithdraw} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="userId" value={createUserId} onChange={(e) => setCreateUserId(e.target.value)} required />
            <Input type="number" step="0.01" placeholder="số tiền" value={createAmount} onChange={(e) => setCreateAmount(Number(e.target.value) || 0)} required />
            <Input placeholder="ghi chú" value={createComment} onChange={(e) => setCreateComment(e.target.value)} required />
            <Button type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Tạo"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
