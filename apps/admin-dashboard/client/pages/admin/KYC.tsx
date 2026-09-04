import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@game/ui/select";
import { Badge } from "@game/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@game/ui/table";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@game/ui/dialog";
import { toast } from "@game/ui/use-toast";
import { listKycs, getKycItem, updateKycApi } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { Tabs, TabsList, TabsTrigger } from "@game/ui/tabs";
import { Users, CheckCircle2, XCircle, Clock, ShieldCheck, Lock, Network, Trophy, Shield } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";

const token = () => getAdminToken() || "";
const envBase = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
const lsBase = (typeof window !== "undefined" && typeof localStorage !== "undefined") ? localStorage.getItem("__API_BASE") : null;
const winBase = (typeof window !== "undefined" && (window as any).__API_BASE) || undefined;
const originApi = (typeof window !== "undefined") ? `${window.location.origin}/api` : undefined;
const API_BASE = (lsBase && lsBase.trim()) || winBase || (envBase && envBase.trim()) || originApi || "/api";
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, "");

type KycRow = {
  _id: string;
  userId: string;
  user?: { _id: string; username?: string; email?: string };
  frontImg?: string;
  backImg?: string;
  type?: string;
  status: "pending" | "verified" | "rejected";
  reason?: string;
  country?: { code?: string; name?: string };
  actionDate?: string;
  createdAt: string;
  updatedAt: string;
};

type ListResp = { data: KycRow[]; total: number };

export default function AdminKYC() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const initialStatus =
    statusParam === "all" || statusParam === "pending" || statusParam === "verified" || statusParam === "rejected"
      ? statusParam
      : "all";
  const [status, setStatus] = React.useState<string>(initialStatus);
  const [email, setEmail] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(20);
  const [startDate, setStartDate] = React.useState<Date>(new Date(Date.now() - 7 * 864e5));
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [allTime, setAllTime] = React.useState<boolean>(true);

  const [items, setItems] = React.useState<KycRow[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const pages = Math.max(1, Math.ceil(total / rowsPerPage));

  const [detail, setDetail] = React.useState<KycRow | null>(null);
  const [detailId, setDetailId] = React.useState<string>("");
  const [dStatus, setDStatus] = React.useState<KycRow["status"]>("pending");
  const [dReason, setDReason] = React.useState<string>("");

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState<KycRow | null>(null);

  // Overview counts
  const [countPending, setCountPending] = React.useState<number | null>(null);
  const [countVerified, setCountVerified] = React.useState<number | null>(null);
  const [countRejected, setCountRejected] = React.useState<number | null>(null);
  const [countAll, setCountAll] = React.useState<number | null>(null);

  async function loadOverview() {
    try {
      const tokenStr = token();
      const opts = { currentPage: 1, rowsPerPage: 1 };
      const [pending, verified, rejected, all] = await Promise.all([
        listKycs({ ...opts, status: 'pending' }, tokenStr),
        listKycs({ ...opts, status: 'verified' }, tokenStr),
        listKycs({ ...opts, status: 'rejected' }, tokenStr),
        listKycs({ ...opts, status: 'all' }, tokenStr),
      ]);
      setCountPending((pending as any)?.total || 0);
      setCountVerified((verified as any)?.total || 0);
      setCountRejected((rejected as any)?.total || 0);
      setCountAll((all as any)?.total || 0);
    } catch (e:any) {
      // ignore overview errors but log
      console.warn('Failed to load KYC overview', e?.message||e);
    }
  }

  async function loadList() {
    try {
      const body: any = { status, currentPage, rowsPerPage };
      if (email && email.trim()) body.email = email.trim();
      if (!allTime) body.date = { start: startDate.toISOString(), end: endDate.toISOString() };
      const data = await listKycs(body, token());
      setItems((data as any)?.items || (data as ListResp)?.data || []);
      setTotal((data as ListResp)?.total || 0);
      toast({ title: "Đã tải danh sách KYC" });
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    }
  }

  React.useEffect(() => { loadList(); loadOverview(); }, []);
  React.useEffect(() => {
    const p = searchParams.get("status");
    if (p === "all" || p === "pending" || p === "verified" || p === "rejected") {
      setStatus(p);
      setCurrentPage(1);
      setTimeout(loadList, 0);
    }
  }, [searchParams]);

  async function viewDetail(id?: string) {
    const kid = id || detailId;
    if (!kid) return;
    try {
      const data = await getKycItem(kid, token());
      setDetail(data as any);
      setDStatus((data as any).status);
      setDReason((data as any).reason || "");
      toast({ title: "Loaded" });
    } catch (e: any) {
      setDetail(null);
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function updateKyc(newStatus?: KycRow["status"]) {
    if (!detail?._id) return;
    const payload = { status: newStatus || dStatus, reason: dReason } as const;
    try {
      await updateKycApi(detail._id, payload, token());
      toast({ title: "KYC updated" });
      await loadList();
      await viewDetail(detail._id);
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-semibold md:text-xl italic">Quản lý KYC</h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Toàn thời gian</div>
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={allTime}
                onChange={(e) => setAllTime(e.target.checked)}
              />
              <Button variant="outline" size="sm" onClick={() => { loadList(); loadOverview(); }}>Refresh</Button>
            </div>
          </div>

          <Tabs value="kyc" className="w-full">
            <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="users"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/users">
                  <Users size={14} /> Danh sách người chơi
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="kyc"
                asChild
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 gap-2 border px-4"
              >
                <Link to="/kyc">
                  <ShieldCheck size={14} /> KYC
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/agents">
                  <Network size={14} /> Danh sách đại lý
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="vip"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/vip">
                  <Trophy size={14} /> Danh sách VIP
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="admins"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/admin/admins">
                  <Shield size={14} /> Danh sách nhân viên
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/admin/roles">
                  <Lock size={14} /> Phân quyền (IAM)
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Overview */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm transition-shadow hover:shadow">
            <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5 lg:p-6 pt-4 sm:pt-5 lg:pt-6">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Chờ duyệt</div>
                <div className="mt-1 text-2xl font-semibold">{countPending === null ? '—' : new Intl.NumberFormat().format(countPending)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Đang chờ xét duyệt{countAll && countPending !== null && countAll > 0 ? ` • ${Math.round((countPending / countAll) * 100)}% tổng` : ''}
                </div>
              </div>
              <div className="rounded-md bg-amber-50 p-2 flex items-center justify-center dark:bg-amber-900/30 shrink-0">
                <Clock className="text-amber-700 dark:text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm transition-shadow hover:shadow">
            <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5 lg:p-6 pt-4 sm:pt-5 lg:pt-6">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Đã duyệt</div>
                <div className="mt-1 text-2xl font-semibold">{countVerified === null ? '—' : new Intl.NumberFormat().format(countVerified)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Đã xác minh thành công{countAll && countVerified !== null && countAll > 0 ? ` • ${Math.round((countVerified / countAll) * 100)}% tổng` : ''}
                </div>
              </div>
              <div className="rounded-md bg-emerald-50 p-2 flex items-center justify-center dark:bg-emerald-900/30 shrink-0">
                <CheckCircle2 className="text-emerald-700 dark:text-emerald-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm transition-shadow hover:shadow">
            <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5 lg:p-6 pt-4 sm:pt-5 lg:pt-6">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Từ chối</div>
                <div className="mt-1 text-2xl font-semibold">{countRejected === null ? '—' : new Intl.NumberFormat().format(countRejected)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Hồ sơ bị từ chối{countAll && countRejected !== null && countAll > 0 ? ` • ${Math.round((countRejected / countAll) * 100)}% tổng` : ''}
                </div>
              </div>
              <div className="rounded-md bg-red-50 p-2 flex items-center justify-center dark:bg-red-900/30 shrink-0">
                <XCircle className="text-red-700 dark:text-red-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm transition-shadow hover:shadow">
            <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5 lg:p-6 pt-4 sm:pt-5 lg:pt-6">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Tổng</div>
                <div className="mt-1 text-2xl font-semibold">{countAll === null ? '—' : new Intl.NumberFormat().format(countAll)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Tất cả hồ sơ</div>
              </div>
              <div className="rounded-md bg-sky-50 p-2 flex items-center justify-center dark:bg-sky-900/30 shrink-0">
                <Users className="text-sky-700 dark:text-sky-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Bộ lọc</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-auto">
              <div className="text-xs text-muted-foreground">Trạng thái</div>
              <Select value={status} onValueChange={(v)=>setStatus(v)}>
                <SelectTrigger className="h-9 w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="verified">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <div className="text-xs text-muted-foreground">Email</div>
              <Input className="h-9 w-full sm:w-56" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="optional" />
            </div>
            <div className="w-full sm:w-auto">
              <div className="text-xs text-muted-foreground">Số dòng</div>
              <Input className="h-9 w-full sm:w-24" type="number" value={rowsPerPage} onChange={(e)=> setRowsPerPage(Math.max(1, Number(e.target.value)||20))} />
            </div>
            <div className="w-full sm:w-auto">
              <div className="text-xs text-muted-foreground">Trang</div>
              <Input className="h-9 w-full sm:w-24" type="number" value={currentPage} onChange={(e)=> setCurrentPage(Math.max(1, Number(e.target.value)||1))} />
            </div>
            <div className="w-full sm:w-auto">
              <div className="text-xs text-muted-foreground">Từ ngày</div>
              <Input className="h-9 w-full sm:w-56" type="date" value={startDate.toISOString().slice(0,10)} onChange={(e)=>{ const v=e.target.value; if (v) setStartDate(new Date(`${v}T00:00:00`)); }} />
            </div>
            <div className="w-full sm:w-auto">
              <div className="text-xs text-muted-foreground">Đến ngày</div>
              <Input className="h-9 w-full sm:w-56" type="date" value={endDate.toISOString().slice(0,10)} onChange={(e)=>{ const v=e.target.value; if (v) setEndDate(new Date(`${v}T00:00:00`)); }} />
            </div>
            <Button onClick={loadList}>Tìm</Button>
            <div className="ml-auto w-full sm:w-auto flex items-center gap-2 justify-between sm:justify-end">
              <Button variant="outline" disabled={currentPage<=1} onClick={()=>{ setCurrentPage(p=>Math.max(1,p-1)); setTimeout(loadList,0); }}>Trước</Button>
              <div className="text-sm text-muted-foreground">{currentPage} / {pages}</div>
              <Button variant="outline" disabled={currentPage>=pages} onClick={()=>{ setCurrentPage(p=>p+1); setTimeout(loadList,0); }}>Sau</Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Yêu cầu KYC</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Loại giấy tờ</TableHead>
                      <TableHead>Quốc gia</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Cập nhật</TableHead>
                      <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((k)=> (
                    <TableRow key={k._id} className={detail?._id===k._id?"bg-muted/40":""}>
                      <TableCell>
                        <div className="leading-tight">
                          <div className="font-medium">{k.user?.username || k.userId}</div>
                          <div className="text-xs text-muted-foreground">{k.user?.email || ""}</div>
                        </div>
                      </TableCell>
                      <TableCell>{k.type || ""}</TableCell>
                      <TableCell className="text-xs">{k.country?.name || ""}</TableCell>
                      <TableCell className="capitalize">
                        {k.status === 'verified' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Đã duyệt</Badge>
                        ) : k.status === 'rejected' ? (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Từ chối</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Chờ duyệt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(k.updatedAt).toLocaleString()}</TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={()=>{ setDetailId(k._id); viewDetail(k._id); }}>Xem</Button>
                        <Button size="sm" variant="outline" onClick={()=>{ setPreviewItem(k); setPreviewOpen(true); }}>Xem ảnh</Button>
                        {k.status!=="verified" && <Button size="sm" onClick={async ()=>{ setDetail(k); setDStatus("verified"); setDReason(""); await updateKyc("verified"); }}>Duyệt</Button>}
                        {k.status!=="rejected" && <Button size="sm" variant="destructive" onClick={async ()=>{ setDetail(k); setDStatus("rejected"); setDReason(prompt("Lý do từ chối")||""); await updateKyc("rejected"); }}>Từ chối</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Chi tiết</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-end gap-2">
                <Input className="w-full sm:w-64" placeholder="Nhập kycId" value={detailId} onChange={(e)=>setDetailId(e.target.value)} />
                <Button onClick={()=>viewDetail()}>Tải</Button>
              </div>

              {detail ? (
                <div className="grid gap-3">
                  <div className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{detail.user?.username || detail.userId}</div>
                      <div className="text-xs text-muted-foreground">•</div>
                      <div className="text-xs text-muted-foreground">{detail.user?.email || ""}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Loại: {detail.type || ""}</div>
                    <div className="text-xs text-muted-foreground">Quốc gia: {detail.country?.name || ""}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Mặt trước</div>
                      {detail.frontImg ? (
                        <img src={`${ASSET_HOST}/${detail.frontImg}`} alt="front" className="rounded border object-cover max-h-48 w-full" />
                      ) : (
                        <div className="text-xs text-muted-foreground">Không có ảnh</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Mặt sau</div>
                      {detail.backImg ? (
                        <img src={`${ASSET_HOST}/${detail.backImg}`} alt="back" className="rounded border object-cover max-h-48 w-full" />
                      ) : (
                        <div className="text-xs text-muted-foreground">Không có ảnh</div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-xs text-muted-foreground">Trạng thái</div>
                    <Select value={dStatus} onValueChange={(v)=>setDStatus(v as any)}>
                      <SelectTrigger className="h-9 w-full sm:w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="verified">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">Lý do</div>
                    <Input value={dReason} onChange={(e)=>setDReason(e.target.value)} placeholder="Tùy chọn" />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={()=>updateKyc()}>Lưu</Button>
                      <Button variant="outline" onClick={()=>{ setDStatus("verified"); setDReason(""); updateKyc(); }}>Duyệt</Button>
                      <Button variant="destructive" onClick={()=>{ const r = prompt("Lý do từ chối")||""; setDReason(r); setDStatus("rejected"); updateKyc(); }}>Từ chối</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Chọn một hồ sơ để xem chi tiết</div>
              )}
            </CardContent>
          </Card>
        </div>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base">Xem trước KYC</DialogTitle>
            </DialogHeader>
            {previewItem ? (
              <div className="grid gap-3">
                <div className="text-sm text-muted-foreground">
                  {previewItem.user?.username || previewItem.userId} • {previewItem.type || ""} • {previewItem.country?.name || ""}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <div className="text-xs text-muted-foreground">Mặt trước</div>
                    {previewItem.frontImg ? (
                      <img src={`${ASSET_HOST}/${previewItem.frontImg}`} alt="front" className="w-full max-h-80 object-contain rounded border" />
                    ) : (
                      <div className="text-xs text-muted-foreground">Không có ảnh</div>
                    )}
                    {previewItem.frontImg && (
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline"><a href={`${ASSET_HOST}/${previewItem.frontImg}`} target="_blank" rel="noreferrer">Mở</a></Button>
                        <Button asChild size="sm"><a href={`${ASSET_HOST}/${previewItem.frontImg}`} download>Tải xuống</a></Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs text-muted-foreground">Mặt sau</div>
                    {previewItem.backImg ? (
                      <img src={`${ASSET_HOST}/${previewItem.backImg}`} alt="back" className="w-full max-h-80 object-contain rounded border" />
                    ) : (
                      <div className="text-xs text-muted-foreground">Không có ảnh</div>
                    )}
                    {previewItem.backImg && (
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline"><a href={`${ASSET_HOST}/${previewItem.backImg}`} target="_blank" rel="noreferrer">Mở</a></Button>
                        <Button asChild size="sm"><a href={`${ASSET_HOST}/${previewItem.backImg}`} download>Tải xuống</a></Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Không có dữ liệu xem trước</div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
