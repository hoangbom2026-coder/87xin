import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { getAffiliateToken, affiliateMe, affiliateLogout, clearAffiliateAuth } from "@/lib/affiliateAuth";
import {
  affiliateReferralCount,
  affiliateDashboard,
  affiliateDashboardAnalysis,
  affiliateUsers,
  affiliateCommission,
  affiliateUpdateCommission,
  affiliateTree,
} from "@/lib/affiliateApi";

export default function AffiliateDashboard() {
  const [token, setToken] = React.useState<string | null>(null);
  const [me, setMe] = React.useState<any>(null);

  const [duration, setDuration] = React.useState<string>("all");
  const [analysisBody, setAnalysisBody] = React.useState<string>("{}");
  const [usersBody, setUsersBody] = React.useState<string>("{\n  \"status\": \"all\",\n  \"currentPage\": 1,\n  \"rowsPerPage\": 50\n}");
  const [commissionBody, setCommissionBody] = React.useState<string>("{}");

  const [refCount, setRefCount] = React.useState<any>(null);
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any>(null);
  const [commission, setCommission] = React.useState<any>(null);
  const [tree, setTree] = React.useState<any>(null);

  React.useEffect(() => {
    const t = getAffiliateToken();
    if (!t) {
      window.location.assign("/affiliate/login");
      return;
    }
    setToken(t);
    affiliateMe(t)
      .then((m) => setMe(m))
      .catch(() => {
        toast({ title: "Phiên đăng nhập đã hết hạn", variant: "destructive" });
        clearAffiliateAuth();
        window.location.assign("/affiliate/login");
      });
  }, []);

  async function doLogout() {
    try { if (token) await affiliateLogout(token); } catch {}
    clearAffiliateAuth();
    window.location.assign("/affiliate/login");
  }

  async function loadBasics() {
    if (!token) return;
    try {
      const [rc, db, cm, tr] = await Promise.all([
        affiliateReferralCount(token),
        affiliateDashboard(duration || undefined, token),
        affiliateCommission(token),
        affiliateTree(token),
      ]);
      setRefCount(rc);
      setDashboard(db);
      setCommission(cm);
      setTree(tr);
      toast({ title: "Đã tải dữ liệu" });
    } catch (e: any) {
      toast({ title: "Tải dữ liệu thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  async function runAnalysis() {
    if (!token) return;
    try {
      const body = JSON.parse(analysisBody || "{}");
      const res = await affiliateDashboardAnalysis(body, token);
      setDashboard((d: any) => ({ ...(d || {}), analysis: res }));
      toast({ title: "Đã tải phân tích" });
    } catch (e: any) {
      toast({ title: "JSON không hợp lệ hoặc có lỗi", description: e?.message || "", variant: "destructive" });
    }
  }

  async function loadUsers() {
    if (!token) return;
    try {
      const body = JSON.parse(usersBody || "{}");
      const res = await affiliateUsers(body, token);
      setUsers(res);
      toast({ title: "Đã tải danh sách người dùng" });
    } catch (e: any) {
      toast({ title: "JSON không hợp lệ hoặc có lỗi", description: e?.message || "", variant: "destructive" });
    }
  }

  async function saveCommission() {
    if (!token) return;
    try {
      const body = JSON.parse(commissionBody || "{}");
      const res = await affiliateUpdateCommission(body, token);
      setCommission(res);
      toast({ title: "Đã cập nhật hoa hồng" });
    } catch (e: any) {
      toast({ title: "JSON không hợp lệ hoặc có lỗi", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-2 flex items-center gap-2">
        <div className="text-sm">Affiliate</div>
        <div className="ml-auto flex items-center gap-2">
          {me ? <div className="text-xs text-muted-foreground">{me.username || me.email}</div> : null}
          <Button size="sm" variant="outline" onClick={doLogout}>Đăng xuất</Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Bảng điều khiển</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBasics} disabled={!token}>Làm mới</Button>
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Bộ lọc</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Khoảng thời gian</div>
              <Input className="h-9 w-40" placeholder="all|7d|30d|..." value={duration} onChange={(e)=> setDuration(e.target.value)} />
            </div>
            <Button onClick={loadBasics}>Tìm kiếm</Button>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Số lượng giới thiệu</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(refCount, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Bảng điều khiển</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(dashboard, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Chạy phân tích</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <Textarea className="min-h-[120px]" value={analysisBody} onChange={(e)=> setAnalysisBody(e.target.value)} />
              <div className="flex justify-end"><Button onClick={runAnalysis}>Chạy</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Người dùng Affiliate</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <Textarea className="min-h-[120px]" value={usersBody} onChange={(e)=> setUsersBody(e.target.value)} />
              <div className="flex justify-end"><Button onClick={loadUsers}>Tải</Button></div>
              {Array.isArray(users?.data) || Array.isArray(users) ? (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên đăng nhập</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(users?.data) ? users.data : users || []).slice(0,50).map((u:any)=> (
                        <TableRow key={u._id}>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Hoa hồng</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <Textarea className="min-h-[160px]" placeholder="{...}" value={commissionBody} onChange={(e)=> setCommissionBody(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={()=> setCommissionBody(JSON.stringify(commission ?? {}, null, 2))}>Tải hiện tại</Button>
                <Button onClick={saveCommission}>Lưu</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cây Affiliate</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-md border p-3 text-xs overflow-auto max-h-[320px]">{JSON.stringify(tree, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
