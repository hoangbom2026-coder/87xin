import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@game/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@game/ui/table";
import { toast } from "@game/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@game/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@game/ui/alert-dialog";
import {
  createStaffApi,
  deleteStaffApi,
  listStaffApi,
  resetStaffPasswordApi,
  updateStaffApi,
  type StaffUser,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  KeyRound,
  Trash2,
  Pencil,
  ShieldCheck,
  Network,
  Trophy,
  Users,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@game/ui/tabs";
import { Link } from "react-router-dom";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";

const PAGE_SIZE = 50;

export default function AdminsPage() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [items, setItems] = useState<StaffUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<StaffUser | null>(null);
  const [openPassword, setOpenPassword] = useState<StaffUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null);

  async function reload(p = page) {
    setLoading(true);
    try {
      const r = await listStaffApi(
        {
          keyword,
          role: role === "all" ? "" : role,
          status: status === "all" ? "" : status,
          page: p,
          limit: PAGE_SIZE,
        },
        token,
      );
      setItems(r.items || []);
      setTotal(r.total || 0);
      setPage(r.page || p);
    } catch (e: any) {
      toast({ title: "Tải staff lỗi", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-xl italic">Quản lý nhân viên</h1>
          </div>

          <Tabs value="admins" className="w-full">
            <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 flex-wrap">
              <TabsTrigger
                value="users"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/users">
                  <Plus className="hidden" /> {/* dummy to avoid error if Plus was expected */}
                  <Search className="hidden" />
                  <Users size={14} /> Danh sách người chơi
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="kyc"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/kyc">
                  <ShieldCheck className="size-3.5" /> KYC
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
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 gap-2 border px-4"
              >
                <Link to="/admin/admins">
                  <ShieldAlert size={14} /> Danh sách nhân viên
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/admin/roles">
                  <KeyRound size={14} /> Phân quyền (IAM)
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Quản trị viên</h1>
            <p className="text-sm text-muted-foreground">Quản lý tài khoản admin/owner toàn hệ thống.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => reload(page)} disabled={loading}>
              <RefreshCw className="mr-2 size-4" /> Làm mới
            </Button>
            <Button size="sm" onClick={() => setOpenCreate(true)}>
              <Plus className="mr-2 size-4" /> Thêm nhân viên
            </Button>
          </div>
        </div>


      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Danh sách</CardTitle>
          <CardDescription>Tổng: {total}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-60">
              <Label className="text-xs">Tìm theo username/email/phone</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="search…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reload(1)}
                />
              </div>
            </div>
            <div className="w-44">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="owner">owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Label className="text-xs">Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="blocked">blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => reload(1)}>Tìm</Button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it._id}>
                    <TableCell className="font-medium">{it.username}</TableCell>
                    <TableCell>{it.email}</TableCell>
                    <TableCell>
                      <Badge variant={it.role === "owner" ? "destructive" : "secondary"}>{it.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={it.status === "active" ? "default" : "outline"}>{it.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {it.createdAt ? format(new Date(it.createdAt), "dd/MM HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setOpenEdit(it)} title="Sửa">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setOpenPassword(it)} title="Đổi mật khẩu">
                        <KeyRound className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(it)} title="Hạ quyền">
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      {loading ? "Đang tải…" : "Không có dữ liệu"}
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

      <CreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        token={token}
        onCreated={() => reload(1)}
      />
      <EditDialog
        item={openEdit}
        onClose={() => setOpenEdit(null)}
        token={token}
        onSaved={() => reload(page)}
      />
      <PasswordDialog
        item={openPassword}
        onClose={() => setOpenPassword(null)}
        token={token}
      />
      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5" /> Hạ quyền admin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản <strong>{confirmDelete?.username}</strong> sẽ bị chuyển về role <code>user</code>.
              Bạn có thể thăng quyền lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteStaffApi(confirmDelete._id, token);
                  toast({ title: "Đã hạ quyền" });
                  setConfirmDelete(null);
                  reload(page);
                } catch (e: any) {
                  toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
                }
              }}
            >Đồng ý</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
    </RequireSuperAdmin>
  );
}

function CreateDialog({
  open, onOpenChange, token, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "admin", phone: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setForm({ username: "", email: "", password: "", role: "admin", phone: "" });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm admin</DialogTitle>
          <DialogDescription>Tạo tài khoản admin/owner mới.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Username</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Mật khẩu (≥8 ký tự)</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="owner">owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone (tùy chọn)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await createStaffApi(form, token);
                toast({ title: "Đã tạo admin" });
                onOpenChange(false);
                onCreated();
              } catch (e: any) {
                toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
              } finally {
                setBusy(false);
              }
            }}
          >Tạo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  item, onClose, token, onSaved,
}: {
  item: StaffUser | null;
  onClose: () => void;
  token: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ role: "admin", status: "active", email: "", phone: "" });
  useEffect(() => {
    if (item) {
      setForm({
        role: item.role,
        status: item.status,
        email: item.email,
        phone: item.phone || "",
      });
    }
  }, [item]);

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa admin</DialogTitle>
          <DialogDescription>{item?.username}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="owner">owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="blocked">blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={async () => {
              if (!item) return;
              try {
                await updateStaffApi(item._id, form, token);
                toast({ title: "Đã lưu" });
                onClose();
                onSaved();
              } catch (e: any) {
                toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
              }
            }}
          >Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  item, onClose, token,
}: {
  item: StaffUser | null;
  onClose: () => void;
  token: string;
}) {
  const [pw, setPw] = useState("");
  useEffect(() => { if (item) setPw(""); }, [item]);
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>{item?.username}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Label>Mật khẩu mới (≥8 ký tự)</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            disabled={pw.length < 8}
            onClick={async () => {
              if (!item) return;
              try {
                await resetStaffPasswordApi(item._id, pw, token);
                toast({ title: "Đã đặt lại mật khẩu" });
                onClose();
              } catch (e: any) {
                toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
              }
            }}
          >Đặt lại</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
