import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Badge } from "@game/ui/badge";
import { Switch } from "@game/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@game/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@game/ui/table";
import { toast } from "@game/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  CheckCircle2,
  Coins,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Users as UsersIcon,
  UserMinus,
  UserPlus,
  Network,
  Loader2,
  Plus,
  Trash2,
  Upload,
  History as HistoryIcon,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getAgentStatsApi,
  listAgentsApi,
  setAgentStatusApi,
  listAgentCommissionsApi,
  getAgentProgramApi,
  patchAgentProgramApi,
  getAgentTreeApi,
  postAgentManualAdjustmentApi,
  postAgentRetryInterestCronApi,
  uploadSettingBannerAsset,
  getAdminInvestLogs,
  getPlans,
  patchPlanStatus,
  duplicatePlan,
  AgentStats,
  AgentRow,
  type IPlanAdmin,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@game/ui/dialog";
import ReferralTree, { ITreeUser } from "@/components/admin/ReferralTree";
import { format } from "date-fns";

const tk = () => getAdminToken() || "";

const fmt = new Intl.NumberFormat("vi-VN");
const money = (v: number) => `${fmt.format(Math.round(v))}`;

export default function AgentsHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  return (
    <AdminLayout>
        <div className="space-y-4">
          <AdminPageHeader
            title="Đại lý (Reagent)"
            description="Chương trình đại lý độc lập với Affiliate. Quản lý cờ reagentEnrolled, hoa hồng đa cấp, điều kiện tham gia & landing /reagent."
          />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="overview">
                <Briefcase className="h-3.5 w-3.5 mr-1" /> Tổng quan
              </TabsTrigger>
              <TabsTrigger value="list">
                <UsersIcon className="h-3.5 w-3.5 mr-1" /> Danh sách đại lý
              </TabsTrigger>
              <TabsTrigger value="commissions">
                <Coins className="h-3.5 w-3.5 mr-1" /> Hoa hồng
              </TabsTrigger>
              <TabsTrigger value="plans">
                <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Gói đầu tư
              </TabsTrigger>
              <TabsTrigger value="history">
                <HistoryIcon className="h-3.5 w-3.5 mr-1" /> Lịch sử
              </TabsTrigger>
              <TabsTrigger value="program">
                <SettingsIcon className="h-3.5 w-3.5 mr-1" /> Cấu hình
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="list" className="mt-4">
              <AgentsListTab />
            </TabsContent>
            <TabsContent value="commissions" className="mt-4">
              <CommissionsTab />
            </TabsContent>
            <TabsContent value="plans" className="mt-4">
              <PlansTab />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HistoryTab />
            </TabsContent>
            <TabsContent value="program" className="mt-4">
              <ProgramTab />
            </TabsContent>
          </Tabs>
        </div>
    </AdminLayout>
  );
}

function HistoryTab() {
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [trxId, setTrxId] = React.useState("");
  const [userId, setUserId] = React.useState("");

  async function reload(p: number) {
    setLoading(true);
    try {
      const r = await getAdminInvestLogs(tk(), {
        page: p,
        limit: 20,
        trxId: trxId.trim() || undefined,
        userId: userId.trim() || undefined,
      });
      if (r?.success) {
        setItems(r.data?.results || []);
        setTotal(Number(r.data?.totalResults ?? 0));
        setPage(p);
      }
    } catch (e: any) {
      toast({ title: "Lỗi tải log", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    reload(1);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4" /> Nhật ký đầu tư Agency
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Mã giao dịch (trxId)"
              className="h-8 w-40 text-xs"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && reload(1)}
            />
            <Input
              placeholder="UserId"
              className="h-8 w-32 text-xs"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && reload(1)}
            />
            <Button size="sm" className="h-8" onClick={() => reload(1)} disabled={loading}>
              <Search size={14} className="mr-1" /> Tìm
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Mã Trx</TableHead>
              <TableHead className="text-xs">UserId</TableHead>
              <TableHead className="text-xs">Cổng</TableHead>
              <TableHead className="text-xs text-right">Số lượng</TableHead>
              <TableHead className="text-xs text-right">Thù lao</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Thanh toán tiếp</TableHead>
              <TableHead className="text-xs">Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it: any) => (
              <TableRow key={it.id || it._id}>
                <TableCell className="font-mono text-[10px]">{it.trxId}</TableCell>
                <TableCell className="text-[10px] font-medium">
                  {typeof it.userId === "object" ? it.userId?._id : it.userId}
                </TableCell>
                <TableCell className="text-[10px] font-bold uppercase">{it.gateway}</TableCell>
                <TableCell className="text-right font-bold text-xs">
                  {Number(it.amount).toLocaleString()} {it.currency}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-500 text-xs">
                  +{Number(it.remuneration ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-[10px] capitalize">{it.status}</TableCell>
                <TableCell className="text-[10px]">
                  {it.nextPayoutDate ? format(new Date(it.nextPayoutDate), "dd/MM/yyyy") : "—"}
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground">
                  {it.createdAt ? format(new Date(it.createdAt), "dd/MM HH:mm") : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!items.length && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                  {loading ? "Đang tải…" : "Không tìm thấy dữ liệu"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Trang {page} / {Math.max(1, Math.ceil(total / 20))}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={page <= 1} onClick={() => reload(page - 1)}>Trước</Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={page * 20 >= total} onClick={() => reload(page + 1)}>Sau</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlansTab() {
  const [rows, setRows] = React.useState<IPlanAdmin[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<"all" | "active" | "inactive">("all");
  const [keyword, setKeyword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getPlans(tk(), { status, keyword, page, limit: 20 });
      if (Array.isArray(data)) {
        setRows(data);
        setTotal(data.length);
      } else {
        setRows(data.items || []);
        setTotal(Number(data.total || 0));
      }
    } catch (e: any) {
      toast({ title: "Lỗi tải gói đầu tư", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [page, status]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="size-4" /> Danh sách gói đầu tư Agency
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" asChild className="h-8">
              <Link to="/admin/plans/new"><Plus className="size-3.5 mr-1" /> Thêm gói</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => load()} disabled={loading}>
              <RefreshCw className={cn("size-3.5 mr-1", loading && "animate-spin")} /> Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Tìm theo tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-8 text-xs"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
          <Button size="sm" className="h-8" onClick={() => { setPage(1); load(); }}>Tìm kiếm</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tên gói</TableHead>
              <TableHead className="text-xs">Giới hạn đầu tư</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs text-right">Hoạt động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell className="text-sm font-medium">{row.name}</TableCell>
                <TableCell className="text-xs">
                  {row.amountType === 0
                    ? `${Number(row.minimum || 0).toLocaleString()} USD - ${Number(row.maximum || 0).toLocaleString()} USD`
                    : `${Number(row.amount || 0).toLocaleString()} USD`}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.status === "active"}
                    onCheckedChange={async (v) => {
                      try {
                        await patchPlanStatus(row._id, v ? "active" : "inactive", tk());
                        await load();
                      } catch (e: any) {
                        toast({ title: "Đổi trạng thái thất bại", description: e?.message, variant: "destructive" });
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" asChild>
                      <Link to={`/admin/plans/${row._id}/edit`}>Sửa</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px]"
                      onClick={async () => {
                        try {
                          await duplicatePlan(row._id, tk());
                          toast({ title: "Đã copy gói" });
                          await load();
                        } catch (e: any) {
                          toast({ title: "Copy thất bại", description: e?.message, variant: "destructive" });
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
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const [stats, setStats] = React.useState<AgentStats | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      setStats(await getAgentStatsApi(tk()));
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const [retrying, setRetrying] = React.useState(false);
  async function handleRetryCron() {
    setRetrying(true);
    try {
      const res = await postAgentRetryInterestCronApi(tk());
      toast({
        title: "Chạy trả lãi thành công",
        description: res.message || `Đã xử lý xong các hợp đồng đến hạn.`,
      });
      load();
    } catch (e) {
      toast({ title: (e as Error).message || "Chạy thất bại", variant: "destructive" });
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5 p-4 rounded-xl border border-amber-500/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
            <Coins className="size-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-amber-500/90 uppercase">Hệ thống Lãi đêm & Dòng tiền Agency</h3>
            <p className="text-[11px] text-muted-foreground">Theo dõi vốn đầu tư, chi trả lãi suất tự động và biến động rút/chuyển quỹ.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRetryCron} 
            disabled={loading || retrying} 
            className="h-9 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20"
          >
            {retrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Coins className="h-4 w-4 mr-2" />}
            Chạy trả lãi đêm
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading || retrying} className="h-9 border-amber-500/10">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard
          title="Đại lý đã Enroll"
          value={fmt.format(stats?.enrolledCount ?? 0)}
          color="text-emerald-400 font-extrabold"
          border="border-t-2 border-emerald-500/50"
          bg="bg-emerald-500/5"
        />
        <StatCard
          title="Người chơi thường"
          value={fmt.format(stats?.nonAgentCount ?? 0)}
          color="text-muted-foreground"
          border="border-t-2 border-muted"
          bg="bg-muted/10"
        />
        <StatCard
          title="Doanh thu phí tham gia"
          value={money(stats?.feeRevenue ?? 0)}
          subtitle={`${fmt.format(stats?.feeCount ?? 0)} lượt đóng phí`}
          color="text-primary font-bold font-mono"
          border="border-t-2 border-primary/50"
          bg="bg-primary/5 shadow-[0_0_15px_-5px_rgba(var(--primary),0.1)]"
        />
        <StatCard
          title="Tổng chi trả lãi đêm"
          value={money(stats?.interestTotal ?? 0)}
          subtitle={`${fmt.format(stats?.interestCount ?? 0)} lượt trả lãi`}
          color="text-amber-500 font-bold font-mono"
          border="border-t-2 border-amber-500/50"
          bg="bg-amber-500/5 shadow-[0_0_15px_-5px_rgba(245,158,11,0.1)]"
        />
        <StatCard
          title="Tổng rút/chuyển quỹ"
          value={money(stats?.transferTotal ?? 0)}
          subtitle={`${fmt.format(stats?.transferCount ?? 0)} lượt chuyển`}
          color="text-sky-500 font-bold font-mono"
          border="border-t-2 border-sky-500/50"
          bg="bg-sky-500/5"
        />
        <StatCard
          title="Tổng hoa hồng mạng lưới"
          value={money(stats?.commissionTotal ?? 0)}
          subtitle={`${fmt.format(stats?.commissionCount ?? 0)} giao dịch`}
          color="text-indigo-500 font-bold font-mono"
          border="border-t-2 border-indigo-500/50"
          bg="bg-indigo-500/5"
        />
      </div>

      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>5 Giao dịch Reagent gần nhất</span>
            <Badge variant="secondary" className="text-[10px] font-normal">Realtime</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 text-[11px]">Thời gian</TableHead>
                <TableHead className="h-8 text-[11px]">Loại</TableHead>
                <TableHead className="h-8 text-[11px]">Mô tả</TableHead>
                <TableHead className="h-8 text-[11px] text-right">Số tiền (VND)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stats?.recent ?? []).map((r, i) => (
                <TableRow key={i} className="group">
                  <TableCell className="text-xs text-muted-foreground py-2">
                    {new Date(String(r.createdAt)).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-[9px] font-medium uppercase tracking-wider">
                      {String(r.gameId ?? "")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2 font-medium">
                    {String(r.typeDescription ?? "")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold py-2">
                    {Number(r.amount ?? 0) > 0 ? (
                      <span className="text-emerald-500">+{money(Number(r.amount ?? 0))}</span>
                    ) : (
                      <span className="text-destructive">{money(Number(r.amount ?? 0))}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!stats?.recent?.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-xs text-muted-foreground py-8"
                  >
                    Chưa có phát sinh giao dịch nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
  border,
  bg,
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  border?: string;
  bg?: string;
}) {
  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md backdrop-blur-sm border-none shadow-sm", bg || "bg-card/60", border)}>
      <CardContent className="p-3 flex flex-col justify-between h-full">
        <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-none">{title}</div>
        <div className="mt-3">
          <div className={cn("text-lg lg:text-xl font-bold tracking-tight truncate leading-none", color)}>{value}</div>
          {subtitle && <div className="text-[10px] text-muted-foreground/70 mt-1.5 truncate font-medium">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentsListTab() {
  const [status, setStatus] = React.useState<"enrolled" | "non" | "all">("enrolled");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<AgentRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  // Tree View State
  const [showTree, setShowTree] = React.useState(false);
  const [selectedAgent, setSelectedAgent] = React.useState<AgentRow | null>(null);
  const [treeData, setTreeData] = React.useState<ITreeUser[]>([]);
  const [treeLoading, setTreeLoading] = React.useState(false);
  const [viewLevel, setViewLevel] = React.useState(5);

  async function reloadTree(lvl: number) {
    if (!selectedAgent) return;
    setTreeLoading(true);
    try {
      const r = await getAgentTreeApi(selectedAgent._id, lvl, tk());
      if (r.success) setTreeData(r.data);
    } catch (e) {
      toast({ title: "Tải cây đại lý thất bại", variant: "destructive" });
    } finally {
      setTreeLoading(false);
    }
  }

  async function openTree(u: AgentRow) {
    setSelectedAgent(u);
    setShowTree(true);
    setTreeLoading(true);
    try {
      const r = await getAgentTreeApi(u._id, viewLevel, tk());
      if (r.success) setTreeData(r.data);
    } catch (e) {
      toast({ title: "Tải cây đại lý thất bại", variant: "destructive" });
    } finally {
      setTreeLoading(false);
    }
  }

  // Manual Adjustment State
  const [showAdj, setShowAdj] = React.useState(false);
  const [adjUser, setAdjUser] = React.useState<AgentRow | null>(null);
  const [adjBalance, setAdjBalance] = React.useState("");
  const [adjLock, setAdjLock] = React.useState("");
  const [adjUnlock, setAdjUnlock] = React.useState("");
  const [adjReason, setAdjReason] = React.useState("");
  const [adjLoading, setAdjLoading] = React.useState(false);

  function openAdj(u: AgentRow) {
    setAdjUser(u);
    setAdjBalance(u.agencyBalance != null ? String(u.agencyBalance) : "0");
    setAdjLock(u.lockUntil ? new Date(u.lockUntil).toISOString().slice(0, 10) : "");
    setAdjUnlock(u.unlockAt ? new Date(u.unlockAt).toISOString().slice(0, 10) : "");
    setAdjReason("");
    setShowAdj(true);
  }

  async function handleAdjSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjUser) return;
    setAdjLoading(true);
    try {
      await postAgentManualAdjustmentApi(
        adjUser._id,
        {
          agencyBalance: adjBalance ? Number(adjBalance) : undefined,
          lockUntil: adjLock ? new Date(adjLock).toISOString() : null,
          unlockAt: adjUnlock ? new Date(adjUnlock).toISOString() : null,
          reason: adjReason || "Admin điều chỉnh thủ công",
        },
        tk()
      );
      toast({ title: "Điều chỉnh thành công" });
      setShowAdj(false);
      load();
    } catch (err) {
      toast({ title: (err as Error).message || "Điều chỉnh thất bại", variant: "destructive" });
    } finally {
      setAdjLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const r = await listAgentsApi({ status, q, page, limit: 20 }, tk());
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [status, page]);

  async function toggle(u: AgentRow) {
    try {
      await setAgentStatusApi(u._id, !u.reagentEnrolled, tk());
      toast({ title: u.reagentEnrolled ? "Đã thu hồi đại lý" : "Đã duyệt làm đại lý" });
      load();
    } catch (e) {
      toast({ title: (e as Error).message || "Thao tác thất bại", variant: "destructive" });
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {(["enrolled", "non", "all"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
              >
                {s === "enrolled" ? "Đã enroll" : s === "non" ? "Chưa enroll" : "Tất cả"}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo username, email..."
              className="pl-7 h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  load();
                }
              }}
            />
          </div>
          <Button size="sm" onClick={() => { setPage(1); load(); }} disabled={loading}>
            Tìm
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Vốn Agency</TableHead>
              <TableHead>Khóa vốn đến</TableHead>
              <TableHead>Số nạp</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(items) ? items : []).map((u) => (
              <TableRow key={u._id}>
                <TableCell>
                  <div className="font-medium text-sm">{u.username}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {u.firstName} {u.lastName}
                  </div>
                </TableCell>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell>
                  {u.reagentEnrolled ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">
                      Đại lý
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Chưa enroll
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-amber-500">
                  {money(u.agencyBalance ?? 0)}
                </TableCell>
                <TableCell className="text-xs">
                  {u.lockUntil ? (
                    <span className={new Date(u.lockUntil) > new Date() ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {new Date(u.lockUntil).toLocaleDateString("vi-VN")}
                    </span>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-xs">{u.depositCount ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openTree(u)}
                      title="Xem cây đại lý"
                    >
                      <Network className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAdj(u)}
                      title="Điều chỉnh thủ công (Số dư / Thời hạn khóa)"
                    >
                      <SettingsIcon className="h-3.5 w-3.5 text-amber-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant={u.reagentEnrolled ? "destructive" : "default"}
                      onClick={() => toggle(u)}
                    >
                      {u.reagentEnrolled ? (
                        <>
                          <UserMinus className="h-3.5 w-3.5 mr-1" /> Thu hồi
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5 mr-1" /> Duyệt
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(Array.isArray(items) ? items : []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-xs text-muted-foreground py-6"
                >
                  {loading ? "Đang tải..." : "Không có dữ liệu"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={showTree} onOpenChange={setShowTree}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                <DialogTitle>
                  Cây đại lý của {selectedAgent?.username}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Số tầng:</span>
                  <select
                    value={viewLevel}
                    onChange={(e) => {
                      const lvl = Number(e.target.value);
                      setViewLevel(lvl);
                      reloadTree(lvl);
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value={1}>F1</option>
                    <option value={2}>F1 → F2</option>
                    <option value={3}>F1 → F3</option>
                    <option value={5}>F1 → F5</option>
                    <option value={10}>F1 → F10</option>
                    <option value={20}>Không giới hạn (F20)</option>
                  </select>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              {treeLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Đang tải dữ liệu mạng lưới...</p>
                </div>
              ) : treeData.length > 0 ? (
                <div className="border rounded-lg p-6 bg-muted/30">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                         <UsersIcon size={20} />
                      </div>
                      <div className="flex flex-col">
                         <span className="font-bold">{selectedAgent?.username} (Root)</span>
                         <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Chủ chuỗi đại lý</span>
                      </div>
                   </div>
                   <ReferralTree users={treeData} parentId={selectedAgent?._id || ""} />
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground italic">
                   Đại lý này chưa có cấp dưới nào.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Điều chỉnh thủ công */}
        <Dialog open={showAdj} onOpenChange={setShowAdj}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Điều chỉnh Gói Agency: {adjUser?.username}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdjSubmit} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Vốn đầu tư Agency (VND)</label>
                <Input
                  type="number"
                  value={adjBalance}
                  onChange={(e) => setAdjBalance(e.target.value)}
                  placeholder="Ví dụ: 2500000"
                  required
                />
                <span className="text-[10px] text-muted-foreground">Số dư riêng để trả lãi đêm và tính thưởng mạng lưới.</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Khóa vốn chính đến ngày</label>
                <Input
                  type="date"
                  value={adjLock}
                  onChange={(e) => setAdjLock(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">Bỏ trống nếu không khóa vốn.</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Khóa hoa hồng trả về đến ngày</label>
                <Input
                  type="date"
                  value={adjUnlock}
                  onChange={(e) => setAdjUnlock(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">Thời hạn khóa các khoản hoa hồng mới cộng dồn.</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Lý do điều chỉnh (Audit Log)</label>
                <Input
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Ví dụ: Thưởng mốc đạt doanh số / Nạp bổ sung"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdj(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={adjLoading}>
                  {adjLoading ? "Đang lưu..." : "Xác nhận lưu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Tổng: {fmt.format(total)} — Trang {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ←
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommissionsTab() {
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = React.useState(0);

  async function load() {
    try {
      const r = await listAgentCommissionsApi({ page, limit: 30 }, tk());
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    }
  }

  React.useEffect(() => {
    load();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người nhận</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(items) ? items : []).map((r, i) => (
              <TableRow key={String(r._id ?? i)}>
                <TableCell className="text-xs">
                  {new Date(String(r.createdAt)).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell className="text-xs">
                  {(r.userId as { username?: string })?.username ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {String(r.gameId ?? "")}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{String(r.typeDescription ?? "")}</TableCell>
                <TableCell className="text-right font-mono">
                  {money(Number(r.amount ?? 0))}
                </TableCell>
              </TableRow>
            ))}
            {(Array.isArray(items) ? items : []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground py-6"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Tổng: {fmt.format(total)} — Trang {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ←
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ProgramShape = {
  enrollment?: {
    gateEnabled?: boolean;
    feeEnabled?: boolean;
    feeAmount?: number;
    feeDescriptionVi?: string;
    denyMessageVi?: string;
  };
  bannerTitle?: string;
  bannerSubtitle?: string;
  ctaLabel?: string;
  investmentCore?: {
    baseOvernightRate?: number;
    capitalLockDays?: number;
    interestCycle?: "daily" | "weekly";
    advancedTiers?: Array<{ id: string; minDeposit: number; interestRate: number }>;
  };
  commissionMatrix?: {
    directCommissionPct?: number;
    indirectCommissionPct?: number;
    commissionLockDays?: number;
    managementBonusPct?: number;
  };
  eligibilityControl?: {
    minDepositVnd?: number;
    minTurnoverVnd?: number;
    requiredTurnoverX?: number;
    autoApproveAgency?: boolean;
  };
  contentSeo?: {
    bannerDesktopMobile?: string;
    introVideoUrl?: string;
    rulesRichText?: string;
    invitePopupEnabled?: boolean;
  };
};

function ProgramTab() {
  const [data, setData] = React.useState<ProgramShape>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = (await getAgentProgramApi(tk())) as ProgramShape;
      setData(r || {});
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await patchAgentProgramApi(data as Record<string, unknown>, tk());
      toast({ title: "Đã lưu cấu hình đại lý" });
    } catch (e) {
      toast({ title: (e as Error).message || "Lưu thất bại", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const en = data.enrollment ?? {};
  const setEn = (patch: Partial<NonNullable<ProgramShape["enrollment"]>>) =>
    setData((d) => ({ ...d, enrollment: { ...d.enrollment, ...patch } }));

  const inv = data.investmentCore ?? {
    baseOvernightRate: 5,
    capitalLockDays: 90,
    interestCycle: "daily",
    advancedTiers: [],
  };
  const setInv = (patch: Partial<NonNullable<ProgramShape["investmentCore"]>>) =>
    setData((d) => ({
      ...d,
      investmentCore: {
        baseOvernightRate: 5,
        capitalLockDays: 90,
        interestCycle: "daily",
        advancedTiers: [],
        ...(d.investmentCore || {}),
        ...patch,
      },
    }));

  const com = data.commissionMatrix ?? {
    directCommissionPct: 50,
    indirectCommissionPct: 50,
    commissionLockDays: 7,
    managementBonusPct: 10,
  };
  const setCom = (patch: Partial<NonNullable<ProgramShape["commissionMatrix"]>>) =>
    setData((d) => ({
      ...d,
      commissionMatrix: {
        directCommissionPct: 50,
        indirectCommissionPct: 50,
        commissionLockDays: 7,
        managementBonusPct: 10,
        ...(d.commissionMatrix || {}),
        ...patch,
      },
    }));

  const eli = data.eligibilityControl ?? {
    minDepositVnd: 1000000,
    minTurnoverVnd: 3000000,
    requiredTurnoverX: 1,
    autoApproveAgency: true,
  };
  const setEli = (patch: Partial<NonNullable<ProgramShape["eligibilityControl"]>>) =>
    setData((d) => ({
      ...d,
      eligibilityControl: {
        minDepositVnd: 1000000,
        minTurnoverVnd: 3000000,
        requiredTurnoverX: 1,
        autoApproveAgency: true,
        ...(d.eligibilityControl || {}),
        ...patch,
      },
    }));

  const seo = data.contentSeo ?? {
    bannerDesktopMobile: "",
    introVideoUrl: "",
    rulesRichText: "",
    invitePopupEnabled: false,
  };
  const setSeo = (patch: Partial<NonNullable<ProgramShape["contentSeo"]>>) =>
    setData((d) => ({
      ...d,
      contentSeo: {
        bannerDesktopMobile: "",
        introVideoUrl: "",
        rulesRichText: "",
        invitePopupEnabled: false,
        ...(d.contentSeo || {}),
        ...patch,
      },
    }));

  async function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await uploadSettingBannerAsset(tk(), file);
      const url = res.filename.startsWith("http") || res.filename.startsWith("/") 
        ? res.filename 
        : `/banners/${res.filename}`;
      setSeo({ bannerDesktopMobile: url });
      toast({ title: "Tải ảnh thành công" });
    } catch (err) {
      toast({ title: (err as Error).message || "Tải ảnh thất bại", variant: "destructive" });
    } finally {
      setUploadingBanner(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Cơ chế Đầu tư & Lãi suất */}
      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Cơ chế Đầu tư & Lãi suất (Investment Core)</span>
            <Badge variant="outline" className="border-primary/30 text-primary">Logic Lãi Đêm</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Lãi suất qua đêm cơ bản (%/tháng)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={inv.baseOvernightRate ?? 5}
                onChange={(e) => setInv({ baseOvernightRate: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Hệ thống chia 30 trả mỗi ngày.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Thời gian khóa vốn gốc (Ngày)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={inv.capitalLockDays ?? 90}
                onChange={(e) => setInv({ capitalLockDays: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Số ngày tối thiểu được rút vốn.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Chu kỳ trả lãi</label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={inv.interestCycle ?? "daily"}
                onChange={(e) => setInv({ interestCycle: e.target.value as "daily" | "weekly" })}
              >
                <option value="daily">Hàng ngày (00:00)</option>
                <option value="weekly">Hàng tuần</option>
              </select>
              <div className="text-[10px] text-muted-foreground">Thời điểm chốt & trả lãi.</div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium">Gói đầu tư nâng cao</div>
                <div className="text-[10px] text-muted-foreground">Tạo các mốc nạp kèm lãi suất ưu đãi riêng.</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-primary/40 hover:bg-primary/10"
                onClick={() => {
                  const current = [...(inv.advancedTiers || [])];
                  current.push({ id: Date.now().toString(), minDeposit: 50000000, interestRate: 15 });
                  setInv({ advancedTiers: current });
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Thêm mốc
              </Button>
            </div>
            {(inv.advancedTiers || []).map((t, idx) => (
              <div key={t.id || idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded border border-border/60">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-muted-foreground">Mốc nạp tối thiểu (VND)</label>
                  <Input
                    type="number"
                    className="h-7 text-xs bg-background"
                    value={t.minDeposit}
                    onChange={(e) => {
                      const current = [...(inv.advancedTiers || [])];
                      current[idx] = { ...t, minDeposit: Number(e.target.value) };
                      setInv({ advancedTiers: current });
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-muted-foreground">Lãi suất áp dụng (%/tháng)</label>
                  <Input
                    type="number"
                    className="h-7 text-xs bg-background"
                    value={t.interestRate}
                    onChange={(e) => {
                      const current = [...(inv.advancedTiers || [])];
                      current[idx] = { ...t, interestRate: Number(e.target.value) };
                      setInv({ advancedTiers: current });
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 self-end mb-[1px]"
                  onClick={() => {
                    const current = (inv.advancedTiers || []).filter((_, i) => i !== idx);
                    setInv({ advancedTiers: current });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Phân bổ Hoa hồng Đa cấp */}
      <Card className="border-secondary/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/5 pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Phân bổ Hoa hồng Đa cấp (Commission Matrix)</span>
            <Badge variant="outline" className="border-secondary/30 text-secondary">Hệ thống MLM</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Hoa hồng trực tiếp F1 (%)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={com.directCommissionPct ?? 50}
                onChange={(e) => setCom({ directCommissionPct: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Thưởng trực tiếp từ phí tham gia.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Hoa hồng gián tiếp F2 (%)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={com.indirectCommissionPct ?? 50}
                onChange={(e) => setCom({ indirectCommissionPct: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Tỷ lệ hưởng trên hoa hồng F1.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Thời gian tạm khóa (Ngày)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={com.commissionLockDays ?? 7}
                onChange={(e) => setCom({ commissionLockDays: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Số ngày Pending trước khi rút.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Thưởng Quản lý (%)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={com.managementBonusPct ?? 10}
                onChange={(e) => setCom({ managementBonusPct: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Hưởng từ lãi hàng ngày tuyến dưới.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Điều kiện & Kiểm soát */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Điều kiện & Kiểm soát (Eligibility & Anti-Fraud)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Yêu cầu nạp tối thiểu (VND)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={eli.minDepositVnd ?? 1000000}
                onChange={(e) => setEli({ minDepositVnd: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Để tính là hội viên hợp lệ.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Yêu cầu doanh thu cược (VND)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={eli.minTurnoverVnd ?? 3000000}
                onChange={(e) => setEli({ minTurnoverVnd: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Để đại lý được hưởng hoa hồng.</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Số vòng cược yêu cầu rút tiền</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={eli.requiredTurnoverX ?? 1}
                onChange={(e) => setEli({ requiredTurnoverX: Number(e.target.value) })}
              />
              <div className="text-[10px] text-muted-foreground">Số vòng cược cho tiền hoa hồng.</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3 mt-2">
            <div>
              <div className="text-sm font-medium">Tự động duyệt Agency</div>
              <div className="text-xs text-muted-foreground">
                Nếu tắt, Admin phải duyệt thủ công khi người dùng nạp đủ tiền phí.
              </div>
            </div>
            <Switch
              checked={eli.autoApproveAgency ?? true}
              onCheckedChange={(v) => setEli({ autoApproveAgency: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Tùy chỉnh Landing Page & Thông báo */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tùy chỉnh Landing Page & Thông báo (Content & SEO)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Banner Image (Desktop/Mobile URL)</label>
              <div className="flex gap-1">
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="/images/promotions/default.webp"
                  value={seo.bannerDesktopMobile ?? ""}
                  onChange={(e) => setSeo({ bannerDesktopMobile: e.target.value })}
                />
                <label className="relative flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted cursor-pointer">
                  {uploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-0 h-0 opacity-0 overflow-hidden"
                    onChange={handleBannerFileChange}
                    disabled={uploadingBanner}
                  />
                </label>
              </div>
              <div className="text-[10px] text-muted-foreground">Hình ảnh nền hiển thị trên trang /agency.</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Video giới thiệu (URL)</label>
              <Input
                className="h-8 text-xs"
                placeholder="https://www.youtube.com/..."
                value={seo.introVideoUrl ?? ""}
                onChange={(e) => setSeo({ introVideoUrl: e.target.value })}
              />
              <div className="text-[10px] text-muted-foreground">Link video Youtube/Vimeo giới thiệu cơ chế.</div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Nội dung Quy tắc (Rich Text)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Soạn thảo các điều khoản hiển thị ở mục Quy tắc đại lý..."
                value={seo.rulesRichText ?? ""}
                onChange={(e) => setSeo({ rulesRichText: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3 mt-2">
            <div>
              <div className="text-sm font-medium">Popup mời gọi tham gia</div>
              <div className="text-xs text-muted-foreground">
                Tự động hiển thị thông báo về chương trình Agency khi người dùng đăng nhập.
              </div>
            </div>
            <Switch
              checked={seo.invitePopupEnabled ?? false}
              onCheckedChange={(v) => setSeo({ invitePopupEnabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cấu hình gốc (Điều kiện tham gia / Landing Banner cũ) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground">Cấu hình Cổng tham gia cơ sở</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Bật cổng tham gia (Gate)</div>
              <div className="text-xs text-muted-foreground">
                Khi tắt: ai cũng có thể truy cập tính năng đại lý.
              </div>
            </div>
            <Switch
              checked={!!en.gateEnabled}
              onCheckedChange={(v) => setEn({ gateEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Thu phí tham gia</div>
              <div className="text-xs text-muted-foreground">
                Trừ vào số dư khi enroll & phân bổ hoa hồng cho upline.
              </div>
            </div>
            <Switch
              checked={!!en.feeEnabled}
              onCheckedChange={(v) => setEn({ feeEnabled: v })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Số tiền phí (VND)</label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={en.feeAmount ?? 0}
                onChange={(e) => setEn({ feeAmount: Number(e.target.value || 0) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Mô tả phí</label>
              <Input
                className="h-8 text-xs"
                value={en.feeDescriptionVi ?? ""}
                onChange={(e) => setEn({ feeDescriptionVi: e.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Thông báo khi không đủ điều kiện</label>
              <Input
                className="h-8 text-xs"
                value={en.denyMessageVi ?? ""}
                onChange={(e) => setEn({ denyMessageVi: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground">Tiêu đề Landing cũ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Tiêu đề banner</label>
              <Input
                className="h-8 text-xs"
                value={data.bannerTitle ?? ""}
                onChange={(e) => setData({ ...data, bannerTitle: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">CTA label</label>
              <Input
                className="h-8 text-xs"
                value={data.ctaLabel ?? ""}
                onChange={(e) => setData({ ...data, ctaLabel: e.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Subtitle</label>
              <Input
                className="h-8 text-xs"
                value={data.bannerSubtitle ?? ""}
                onChange={(e) => setData({ ...data, bannerSubtitle: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={load} disabled={loading} className="h-8 text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tải lại
        </Button>
        <Button onClick={save} disabled={saving} className="h-8 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
      </div>
    </div>
  );
}
