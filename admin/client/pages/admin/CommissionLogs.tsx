import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { getAdminAffiliateRewardLogs } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Coins, RefreshCw } from "lucide-react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

type LogType = "commission" | "referral";

export default function CommissionLogsPage() {
  const [type, setType] = useState<LogType>("commission");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitorUsername, setInvitorUsername] = useState("");

  async function reload(p: number, t: LogType) {
    const token = getAdminToken() || "";
    if (!token) {
      setError("Chưa đăng nhập admin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await getAdminAffiliateRewardLogs(token, {
        type: t,
        invitorUsername: invitorUsername.trim() || undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      setItems(Array.isArray(r.data) ? r.data : []);
      setTotal(Number(r.total || 0));
      setPage(p);
    } catch (e: any) {
      const msg = e?.message || "Lỗi tải log";
      setError(msg);
      toast({ title: "Lỗi tải log", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload(1, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đổi tab type
  }, [type]);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Coins className="size-6" /> Nhật ký hoa hồng
            </h1>
            <p className="text-sm text-muted-foreground">
              Commission & referral — toàn hệ thống (chỉ admin).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => reload(page)} disabled={loading}>
            <RefreshCw className="mr-2 size-4" /> Làm mới
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
            <CardDescription>Tổng: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Upline (username người nhận HH)</div>
                <Input
                  className="h-9 w-48"
                  placeholder="vd: hoangbom98"
                  value={invitorUsername}
                  onChange={(e) => setInvitorUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reload(1, type)}
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => reload(1, type)}>
                Lọc
              </Button>
            </div>

            <Tabs value={type} onValueChange={(v) => setType(v as LogType)}>
              <TabsList>
                <TabsTrigger value="commission">Commission</TabsTrigger>
                <TabsTrigger value="referral">Referral</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-4 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>From user</TableHead>
                    <TableHead>To user</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it: any, idx: number) => (
                    <TableRow key={it._id ?? idx}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {it.createdAt ? format(new Date(it.createdAt), "dd/MM HH:mm:ss") : "—"}
                      </TableCell>
                      <TableCell className="font-medium">{it.fromUsername ?? "—"}</TableCell>
                      <TableCell>{it.toUsername ?? "—"}</TableCell>
                      <TableCell>
                        {it.level !== undefined ? <Badge variant="secondary">F{it.level}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number(it.amount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {it.source ?? it.referralCode ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        {loading ? "Đang tải…" : "Chưa có log"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">
                Trang {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
              </span>
              <div className="space-x-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => reload(page - 1, type)}>
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * PAGE_SIZE >= total}
                  onClick={() => reload(page + 1, type)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
