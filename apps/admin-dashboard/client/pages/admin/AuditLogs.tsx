import * as React from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminAuditLogs } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { RefreshCw } from "lucide-react";

export default function AuditLogsPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    const t = getAdminToken();
    if (!t) return;
    setLoading(true);
    try {
      const res = await getAdminAuditLogs(t, 200);
      setRows(Array.isArray((res as any)?.items) ? (res as any).items : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Nhật ký thao tác admin"
          description="Append-only — ghi khi cập nhật cấu hình site (PATCH settings). Có thể mở rộng log balance/user sau."
          actions={
            <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              {loading ? "Đang tải…" : "Làm mới"}
            </Button>
          }
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Thời gian</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead className="max-w-[280px]">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={String(r._id)}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{r.adminUsername || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.action}</TableCell>
                  <TableCell className="text-xs">
                    {r.targetType}:{r.targetId}
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate text-xs text-muted-foreground" title={r.details}>
                    {r.details || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Chưa có log — thử lưu cấu hình tại Website / Site hoặc Marketing.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
