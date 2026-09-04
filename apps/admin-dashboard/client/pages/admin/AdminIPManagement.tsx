import React, { useState, useEffect } from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  listIPAccessAdminApi,
  createIPAccessAdminApi,
  updateIPAccessAdminApi,
  deleteIPAccessAdminApi,
  IPAccessItem,
} from "@/lib/api";
import { ShieldAlert, ShieldCheck, Plus, Trash2, Search, RefreshCw, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminIPManagement() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<IPAccessItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [type, setType] = useState<string>("all");
  const [module, setModule] = useState<string>("all");
  const [keyword, setKeyword] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [formIp, setFormIp] = useState("");
  const [formType, setFormType] = useState<"whitelist" | "blacklist">("blacklist");
  const [formModule, setFormModule] = useState<"admin" | "api" | "frontend" | "all">("all");
  const [formReason, setFormReason] = useState("");
  const [formExpiresDays, setFormExpiresDays] = useState<string>("0"); // 0 = vĩnh viễn
  const [submitting, setSubmitting] = useState(false);

  async function fetchItems() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listIPAccessAdminApi(
        { type, module, keyword, page, limit },
        token,
      );
      setItems(res?.items || []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      toast({
        title: "Lỗi tải danh sách IP",
        description: err?.message || "Không thể kết nối đến máy chủ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [token, type, module, page]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchItems();
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formIp.trim() || !token) {
      toast({ title: "Vui lòng nhập địa chỉ IP hợp lệ", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let expiresAt: string | null = null;
      const days = Number(formExpiresDays);
      if (days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }

      await createIPAccessAdminApi(
        {
          ipAddress: formIp.trim(),
          type: formType,
          module: formModule,
          reason: formReason.trim() || "Không có lý do",
          expiresAt,
        },
        token,
      );

      toast({ title: "Đã thêm IP thành công vào danh sách" });
      setCreateOpen(false);
      // Reset form
      setFormIp("");
      setFormReason("");
      setFormExpiresDays("0");
      fetchItems();
    } catch (err: any) {
      toast({
        title: "Lỗi thêm IP",
        description: err?.message || "Địa chỉ IP có thể đã tồn tại hoặc không hợp lệ",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn gỡ bỏ IP này khỏi danh sách?")) return;
    if (!token) return;
    try {
      await deleteIPAccessAdminApi(id, token);
      toast({ title: "Đã gỡ bỏ IP thành công" });
      fetchItems();
    } catch (err: any) {
      toast({
        title: "Lỗi gỡ bỏ IP",
        description: err?.message || "",
        variant: "destructive",
      });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Quản lý Truy cập IP (Đen / Trắng)"
          description="Kiểm soát danh sách IP Whitelist (ưu tiên bỏ qua chặn) và Blacklist (cấm truy cập hệ thống) hỗ trợ dải mạng CIDR và tự động gỡ chặn."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchItems()}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Thêm IP mới
              </Button>
            </div>
          }
        />

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm IP hoặc CIDR..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="whitelist">Whitelist (Trắng)</SelectItem>
                  <SelectItem value="blacklist">Blacklist (Đen)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={module} onValueChange={(v) => { setModule(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Module áp dụng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả module</SelectItem>
                  <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                  <SelectItem value="api">Hệ thống API (REST)</SelectItem>
                  <SelectItem value="frontend">Giao diện (Frontend)</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" variant="secondary">
                Tìm kiếm
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Địa chỉ IP / CIDR</TableHead>
                    <TableHead className="w-[120px]">Phân loại</TableHead>
                    <TableHead className="w-[120px]">Phạm vi</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead className="text-center w-[100px]">Số lần chặn</TableHead>
                    <TableHead className="w-[150px]">Thời hạn</TableHead>
                    <TableHead className="w-[130px]">Người tạo</TableHead>
                    <TableHead className="text-right w-[80px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy quy tắc IP nào khớp với bộ lọc.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-mono font-medium">
                          {item.ipAddress}
                        </TableCell>
                        <TableCell>
                          {item.type === "whitelist" ? (
                            <Badge variant="outline" className="border-emerald-500/60 text-emerald-600 bg-emerald-500/10">
                              <ShieldCheck className="mr-1 size-3 inline" /> Whitelist
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-destructive/60 text-destructive bg-destructive/10">
                              <ShieldAlert className="mr-1 size-3 inline" /> Blacklist
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase text-[10px]">
                            {item.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs" title={item.reason}>
                          {item.reason}
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold">
                          {item.hitCount > 0 ? (
                            <span className="text-destructive">{item.hitCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.expiresAt ? (
                            new Date(item.expiresAt) > new Date() ? (
                              <span>Đến {new Date(item.expiresAt).toLocaleDateString("vi-VN")}</span>
                            ) : (
                              <span className="text-destructive font-medium">Đã hết hạn</span>
                            )
                          ) : (
                            <span className="text-emerald-600">Vĩnh viễn</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">
                          {item.createdBy || "system"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(item._id)}
                            title="Xóa quy tắc"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {total > limit && (
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong tổng số {total} IP
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * limit >= total}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cẩm nang Hướng dẫn CIDR */}
        <div className="mt-6 rounded-lg border border-dashed p-4 bg-muted/40 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <AlertCircle className="size-4 text-primary" /> Hướng dẫn cú pháp địa chỉ mạng
          </div>
          <p>• Hỗ trợ địa chỉ đơn lẻ chuẩn IPv4 (ví dụ: <code className="font-mono text-foreground">192.168.1.5</code>) hoặc IPv6.</p>
          <p>• Hỗ trợ định dạng CIDR để khóa toàn bộ dải (ví dụ: <code className="font-mono text-foreground">113.160.0.0/16</code> hoặc <code className="font-mono text-foreground">10.0.0.0/24</code>).</p>
          <p>• Nếu một IP đồng thời nằm trong cả danh sách Đen và Trắng, hệ thống sẽ ưu tiên cho phép đi qua (Quy tắc Whitelist ghi đè Blacklist).</p>
        </div>

        {/* Create Dialog Modal */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Thêm quy tắc kiểm soát IP mới</DialogTitle>
                <DialogDescription>
                  Nhập địa chỉ IP đơn lẻ hoặc dải mạng để áp dụng bộ lọc truy cập.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="ip">Địa chỉ IP / CIDR (*)</Label>
                  <Input
                    id="ip"
                    placeholder="Ví dụ: 14.248.82.15 hoặc 113.170.0.0/24"
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Phân loại</Label>
                    <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blacklist">Blacklist (Chặn)</SelectItem>
                        <SelectItem value="whitelist">Whitelist (Cho qua)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Phạm module</Label>
                    <Select value={formModule} onValueChange={(v: any) => setFormModule(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả hệ thống</SelectItem>
                        <SelectItem value="admin">Admin Panel</SelectItem>
                        <SelectItem value="api">REST API</SelectItem>
                        <SelectItem value="frontend">Web Portal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Lý do áp dụng</Label>
                  <Input
                    id="reason"
                    placeholder="Ví dụ: Brute force login, Spam API, Đối tác tin cậy..."
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Thời gian hiệu lực</Label>
                  <Select value={formExpiresDays} onValueChange={setFormExpiresDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Vĩnh viễn (Không hết hạn)</SelectItem>
                      <SelectItem value="1">1 ngày</SelectItem>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Xác nhận tạo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
