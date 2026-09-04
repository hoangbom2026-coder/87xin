import * as React from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Button } from "@game/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@game/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@game/ui/dialog";
import { Label } from "@game/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@game/ui/alert";
import { Badge } from "@game/ui/badge";
import { toast } from "@game/ui/use-toast";
import { Skeleton } from "@game/ui/skeleton";
import {
  getSupportStats,
  getUsers,
  setUserPassword,
  type SupportStats,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@game/ui/tabs";
import {
  ArrowRight,
  BookMarked,
  HeartHandshake,
  KeyRound,
  LifeBuoy,
  MessagesSquare,
  ShieldAlert,
  Ticket,
  Megaphone,
} from "lucide-react";

const tk = () => getAdminToken() || "";

type UserRow = {
  _id: string;
  username: string;
  email?: string;
  status: string;
};

function HubCard({
  to,
  icon: Icon,
  title,
  desc,
  badge,
  cta,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: React.ReactNode;
  cta: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-start gap-2">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1 text-xs">{desc}</CardDescription>
          </div>
        </div>
        {badge}
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to={to}>
            {cta} <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CustomerCarePage() {
  // Reset password state
  const [username, setUsername] = React.useState("");
  const [emailFilter, setEmailFilter] = React.useState("");
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [dlgOpen, setDlgOpen] = React.useState(false);
  const [target, setTarget] = React.useState<UserRow | null>(null);
  const [pw, setPw] = React.useState("");
  const [savingPw, setSavingPw] = React.useState(false);

  // Stats
  const [stats, setStats] = React.useState<SupportStats | null>(null);
  React.useEffect(() => {
    getSupportStats(tk())
      .then(setStats)
      .catch(() => undefined);
  }, []);

  async function search() {
    const uq = username.trim();
    const eq = emailFilter.trim().toLowerCase();
    const emailOk = eq.includes("@") && eq.length >= 6;
    if (uq.length < 2 && !emailOk) {
      toast({
        title: "Chưa đủ để tìm",
        description: "Nhập username ≥2 ký tự hoặc email đầy đủ.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = (await getUsers(
        {
          status: "active",
          username: uq,
          email: eq,
          phone: "",
          currentPage: 1,
          rowsPerPage: 25,
          isAll: true,
        } as never,
        tk(),
      )) as { data?: UserRow[]; total?: number };
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (e) {
      toast({
        title: "Lỗi tìm kiếm",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function applyReset() {
    if (!target || pw.length < 6) {
      toast({
        title: "Mật khẩu không hợp lệ",
        description: "Tối thiểu 6 ký tự.",
        variant: "destructive",
      });
      return;
    }
    setSavingPw(true);
    try {
      await setUserPassword(target._id, pw, tk());
      toast({
        title: "Đã đặt mật khẩu mới",
        description: `User ${target.username} — phiên cũ bị huỷ.`,
      });
      setDlgOpen(false);
    } catch (e) {
      toast({
        title: "Thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <AdminPageHeader
            title="Trung tâm CSKH"
            description="Một cửa cho mọi tác vụ chăm sóc khách hàng — chat realtime, tickets, FAQ, công cụ vận hành."
          />

          <Tabs value="cskh" className="w-full">
            <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="marketing"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/marketing-hub">
                  <Megaphone size={14} /> Marketing Hub
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="cskh"
                asChild
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 gap-2 border px-4"
              >
                <Link to="/customer-care">
                  <HeartHandshake size={14} /> Trung tâm CSKH
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/admin/tickets">
                  <Ticket size={14} /> Quản lý Tickets
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Hub navigation */}
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <HubCard
            to="/customer-care/chat"
            icon={MessagesSquare}
            title="Live Chat CSKH"
            desc="Trả lời khách realtime — thay thế LiveChat external. Có hệ tag, note nội bộ."
            cta="Mở phòng chat"
            badge={
              stats && (stats.open + stats.pending) > 0 ? (
                <Badge className="bg-red-500 hover:bg-red-500">
                  {stats.open + stats.pending}
                </Badge>
              ) : undefined
            }
          />
          <HubCard
            to="/admin/tickets"
            icon={Ticket}
            title="Tickets (asynchronous)"
            desc="Vé hỗ trợ có chủ đề/độ ưu tiên, lưu lâu dài, phù hợp với ca phức tạp."
            cta="Quản lý tickets"
          />
          <HubCard
            to="/help-center"
            icon={LifeBuoy}
            title="Help Center (CMS)"
            desc="Quản lý FAQ, danh mục trợ giúp hiển thị cho khách trên frontend."
            cta="Sửa nội dung"
          />
          <HubCard
            to="/notifications"
            icon={HeartHandshake}
            title="Thông báo đẩy"
            desc="Gửi thông báo trong app cho người dùng — campaign chăm sóc."
            cta="Soạn thông báo"
          />
        </div>

        {/* Operational tool: reset password */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" /> Công cụ: Đặt lại mật khẩu
            </CardTitle>
            <CardDescription>
              Sau khi xác minh chủ tài khoản qua kênh hợp lệ. Thao tác được ghi
              vào nhật ký mật khẩu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <ShieldAlert className="size-4" />
              <AlertTitle>Quy trình tối thiểu</AlertTitle>
              <AlertDescription>
                Khuyến khích khách dùng &ldquo;Quên mật khẩu&rdquo; (OTP email).
                Chỉ can thiệp admin khi không nhận mail / khẩn cấp và đã đối
                chiếu danh tính.
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="max-w-xs"
              />
              <Input
                placeholder="Email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={search} disabled={loading}>
                {loading ? "Đang tìm…" : "Tìm"}
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tài khoản</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">{r.username}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.email ?? "—"}
                        </TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setTarget(r);
                              setPw("");
                              setDlgOpen(true);
                            }}
                          >
                            Đặt MK
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rows.length && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-xs text-muted-foreground"
                        >
                          {total === 0 ? "Chưa tìm — nhập và bấm Tìm." : "Không có kết quả"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookMarked className="size-4" /> Liên kết liên quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/users">Quản lý người dùng</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/kyc">KYC</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/financial">Tài chính · nạp rút</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/audit-logs">Audit log</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/settings/telegram">Cấu hình Telegram bot</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đặt mật khẩu mới · {target?.username}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="npw">Mật khẩu mới</Label>
              <Input
                id="npw"
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlgOpen(false)}>
                Huỷ
              </Button>
              <Button onClick={applyReset} disabled={savingPw || pw.length < 6}>
                {savingPw ? "Đang lưu…" : "Xác nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
