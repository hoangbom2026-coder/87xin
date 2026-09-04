import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@game/ui/table";
import { toast } from "@game/ui/use-toast";
import { closeTicketApi, getAdminTickets } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Search } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const tk = () => getAdminToken() || "";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open":
      return <Badge variant="destructive">Mở</Badge>;
    case "replied":
      return (
        <Badge className="border-none bg-blue-500 text-white" variant="outline">
          Đã phản hồi
        </Badge>
      );
    case "answered":
      return <Badge variant="secondary">Admin trả lời</Badge>;
    case "closed":
      return <Badge variant="outline">Đã đóng</Badge>;
    default:
      return <Badge>{status || "-"}</Badge>;
  }
}

export default function AdminTickets() {
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminTickets(tk());
      setTickets(Array.isArray((data as any)?.items) ? (data as any).items : []);
    } catch (e: any) {
      toast({
        title: "Tải vé thất bại",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function handleClose(id: string) {
    if (!confirm("Đóng vé này?")) return;
    try {
      await closeTicketApi(id, tk());
      toast({ title: "Đã đóng vé" });
      await load();
    } catch (e: any) {
      toast({
        title: "Đóng vé thất bại",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  const filtered = React.useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      const id = String(t._id || "").toLowerCase();
      const username = String(t.userId?.username || "").toLowerCase();
      const email = String(t.userId?.email || "").toLowerCase();
      const subject = String(t.subject || "").toLowerCase();
      const status = String(t.status || "").toLowerCase();
      return (
        id.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        subject.includes(q) ||
        status.includes(q)
      );
    });
  }, [tickets, keyword]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-xl">Tất cả vé</h1>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                Danh sách hỗ trợ ({filtered.length})
              </CardTitle>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex w-full max-w-sm items-center gap-2"
              >
                <Input
                  placeholder="Tìm theo ID, người dùng, chủ đề, trạng thái..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button type="submit" size="icon" aria-label="Tìm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={load}
                  disabled={loading}
                >
                  {loading ? "Đang tải..." : "Làm mới"}
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id hỗ trợ</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Chủ thể</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Được tạo vào lúc</TableHead>
                      <TableHead className="text-right">Hoạt động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Không tìm thấy vé nào
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-mono text-xs">
                          #{String(t._id || "").slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {t.userId?.username || "Unknown"}
                          </div>
                          {t.userId?.email && (
                            <div className="text-xs text-muted-foreground">
                              {t.userId.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {t.subject || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                        </TableCell>
                        <TableCell>
                          {t.createdAt
                            ? format(new Date(t.createdAt), "dd/MM/yyyy HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/admin/tickets/${t._id}`}>
                              <Button size="sm">Chi tiết</Button>
                            </Link>
                            {t.status !== "closed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClose(t._id)}
                              >
                                Đóng
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
