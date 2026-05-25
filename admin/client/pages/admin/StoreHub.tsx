import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "@/components/ui/use-toast";
import {
  Boxes,
  Coins,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store as StoreIcon,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminToken } from "@/lib/adminAuth";
import {
  getStoreStatsApi,
  listStorePackagesApi,
  createStorePackageApi,
  updateStorePackageApi,
  deleteStorePackageApi,
  listStoreOrdersApi,
  StoreStats,
  StoreOrderRow,
  IPackage,
} from "@/lib/api";

const tk = () => getAdminToken() || "";
const fmt = new Intl.NumberFormat("vi-VN");
const money = (v: number) => fmt.format(Math.round(v));

export default function StoreHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-4">
          <AdminPageHeader
            title="Cửa hàng (Store)"
            description="Bán gói coins / VIP XP / quyền lợi qua số dư người chơi. Tách biệt với chương trình Đại lý/Affiliate/VIP — mọi đơn ghi vào transactions provider=store."
          />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="overview">
                <StoreIcon className="h-3.5 w-3.5 mr-1" /> Tổng quan
              </TabsTrigger>
              <TabsTrigger value="packages">
                <Boxes className="h-3.5 w-3.5 mr-1" /> Gói hàng
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Đơn hàng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="packages" className="mt-4">
              <PackagesTab />
            </TabsContent>
            <TabsContent value="orders" className="mt-4">
              <OrdersTab />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}

function OverviewTab() {
  const [stats, setStats] = React.useState<StoreStats | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      setStats(await getStoreStatsApi(tk()));
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Làm mới
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard title="Tổng gói" value={fmt.format(stats?.totalPackages ?? 0)} subtitle={`${stats?.activePackages ?? 0} đang bật`} />
        <StatCard title="Doanh thu (toàn thời gian)" value={money(stats?.revenueAllTime ?? 0)} subtitle={`${fmt.format(stats?.ordersAllTime ?? 0)} đơn`} color="text-emerald-600" />
        <StatCard title="Doanh thu 7 ngày" value={money(stats?.revenue7d ?? 0)} subtitle={`${fmt.format(stats?.orders7d ?? 0)} đơn`} color="text-sky-600" />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold mt-1 ${color || ""}`}>{value}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function PackagesTab() {
  const [items, setItems] = React.useState<IPackage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState<IPackage | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listStorePackagesApi(tk());
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => { load(); }, []);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<IPackage> = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      goldCoins: Number(fd.get("goldCoins") || 0),
      freeCoins: Number(fd.get("freeCoins") || 0),
      price: Number(fd.get("price") || 0),
      order: Number(fd.get("order") || 0),
      status: "active",
    };
    if (!payload.title || !payload.price) {
      toast({ title: "Vui lòng điền tên & giá", variant: "destructive" });
      return;
    }
    try {
      await createStorePackageApi(payload, tk());
      toast({ title: "Đã tạo gói" });
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      toast({ title: (err as Error).message || "Tạo thất bại", variant: "destructive" });
    }
  }

  async function onSave(p: IPackage) {
    try {
      await updateStorePackageApi(p._id, p, tk());
      toast({ title: "Đã lưu" });
    } catch (e) {
      toast({ title: (e as Error).message || "Lưu thất bại", variant: "destructive" });
    }
  }
  async function onDelete() {
    if (!confirmDel) return;
    try {
      await deleteStorePackageApi(confirmDel._id, tk());
      toast({ title: "Đã xóa" });
      setConfirmDel(null);
      load();
    } catch (e) {
      toast({ title: (e as Error).message || "Xóa thất bại", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tạo gói mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Tên gói</Label>
              <Input name="title" required />
            </div>
            <div className="space-y-1">
              <Label>Giá (VND)</Label>
              <Input name="price" type="number" required />
            </div>
            <div className="space-y-1">
              <Label>Thứ tự</Label>
              <Input name="order" type="number" defaultValue={0} />
            </div>
            <div className="space-y-1">
              <Label>Coin vàng</Label>
              <Input name="goldCoins" type="number" defaultValue={0} />
            </div>
            <div className="space-y-1">
              <Label>Coin miễn phí</Label>
              <Input name="freeCoins" type="number" defaultValue={0} />
            </div>
            <div className="md:col-span-3 space-y-1">
              <Label>Mô tả ngắn</Label>
              <Textarea name="description" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Tạo gói</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Danh sách gói ({items.length})</span>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">
              {loading ? "Đang tải..." : "Chưa có gói nào"}
            </div>
          )}
          {items.map((p, idx) => (
            <div key={p._id} className="border p-3 rounded-md grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Tên</Label>
                <Input
                  value={p.title}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...p, title: e.target.value };
                    setItems(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Giá</Label>
                <Input
                  type="number"
                  value={p.price}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...p, price: Number(e.target.value) };
                    setItems(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vàng</Label>
                <Input
                  type="number"
                  value={p.goldCoins}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...p, goldCoins: Number(e.target.value) };
                    setItems(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Coin miễn phí</Label>
                <Input
                  type="number"
                  value={p.freeCoins}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...p, freeCoins: Number(e.target.value) };
                    setItems(next);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={p.status === "active"}
                  onCheckedChange={(v) => {
                    const next = [...items];
                    next[idx] = { ...p, status: v ? "active" : "inactive" };
                    setItems(next);
                  }}
                />
                <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">
                  {p.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Badge>
              </div>
              <div className="md:col-span-6 flex justify-end gap-2">
                <Button size="sm" onClick={() => onSave(p)}>
                  Lưu
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirmDel(p)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa gói "{confirmDel?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động không thể hoàn tác. Người chơi đã mua gói này vẫn giữ phần thưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrdersTab() {
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<StoreOrderRow[]>([]);
  const [total, setTotal] = React.useState(0);

  async function load() {
    try {
      const r = await listStoreOrdersApi({ page, limit: 30 }, tk());
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    }
  }
  React.useEffect(() => { load(); }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người mua</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số dư trước</TableHead>
              <TableHead>Số dư sau</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r._id}>
                <TableCell className="text-xs">
                  {new Date(r.createdAt).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell className="text-xs">
                  {(r.userId as { username?: string })?.username ?? "-"}
                </TableCell>
                <TableCell className="text-xs">{r.typeDescription}</TableCell>
                <TableCell className="text-xs font-mono">{money(r.beforeAmount)}</TableCell>
                <TableCell className="text-xs font-mono">{money(r.afterAmount)}</TableCell>
                <TableCell className="text-right font-mono text-emerald-600">
                  +{money(r.amount)}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-xs text-muted-foreground py-6"
                >
                  Chưa có đơn hàng
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Coins className="h-3 w-3" /> Tổng: {fmt.format(total)} — Trang {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ←
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
