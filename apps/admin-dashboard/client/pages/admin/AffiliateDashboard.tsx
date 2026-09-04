import React from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";

import { getUsers, listTransactions, listBetTransactions } from "@/lib/api";

type UserRow = { _id: string; username: string; createdAt: string; inviteCode?: string; invitorId?: string };

type Metric = { label: string; value: string | number };

export default function AdminAffiliateDashboard() {
  const token = React.useMemo(() => getAdminToken() || "", []);

  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(2000);
  const [startDate, setStartDate] = React.useState<Date>(new Date(Date.now() - 7 * 864e5));
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [allTime, setAllTime] = React.useState<boolean>(false);

  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [commissionTx, setCommissionTx] = React.useState<any[]>([]);
  const [referralTx, setReferralTx] = React.useState<any[]>([]);
  const [referredBetStats, setReferredBetStats] = React.useState<{ bet: number; win: number }>({ bet: 0, win: 0 });

  async function load() {
    try {
      if (!token) return;
      const date = allTime ? undefined : { start: startDate.toISOString(), end: endDate.toISOString() };

      const usersReq = (status: string) =>
        getUsers(
          {
            status,
            username: "",
            currentPage: 1,
            rowsPerPage,
            isAll: true,
            ...(date ? { date } : {}),
          },
          token,
        );

      const trxReq = (type: string) =>
        listTransactions(
          {
            type,
            username: "",
            currentPage,
            rowsPerPage: 2000,
            ...(date ? { date } : {}),
          },
          token,
        );

      const betReq = listBetTransactions(
        {
          type: "all",
          username: "",
          currentPage: 1,
          rowsPerPage: 5000,
          ...(date ? { date } : {}),
        },
        token,
      );

      const [ua, ub, commission, referral, bets] = await Promise.all([
        usersReq("active"),
        usersReq("blocked"),
        trxReq("commission"),
        trxReq("referral"),
        betReq,
      ]);

      const allUsers: UserRow[] = [
        ...(((ua as any)?.data || (Array.isArray(ua) ? ua : [])) as any[]),
        ...(((ub as any)?.data || (Array.isArray(ub) ? ub : [])) as any[]),
      ];

      const referred = allUsers.filter((u: any) => Boolean(u?.inviteCode || u?.invitorId));
      const normal = allUsers.length - referred.length;

      const commissionItems = (commission as any)?.data || [];
      const referralItems = (referral as any)?.data || [];

      const commissionSum = commissionItems.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const referralSum = referralItems.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

      const referredIds = new Set(referred.map((u: any) => String(u._id)));
      const betItems = (bets as any)?.data || [];
      const betSum = betItems
        .filter((t: any) => referredIds.has(String(t.userId)) && String(t.type).toLowerCase() === "bet")
        .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);
      const winSum = betItems
        .filter((t: any) => referredIds.has(String(t.userId)) && String(t.type).toLowerCase() === "win")
        .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);

      setCommissionTx(commissionItems.slice(0, 50));
      setReferralTx(referralItems.slice(0, 50));
      setReferredBetStats({ bet: betSum, win: winSum });

      setMetrics([
        { label: "Registrations (total)", value: allUsers.length },
        { label: "Referral registrations", value: referred.length },
        { label: "Normal registrations", value: normal },
        { label: "Commission converted", value: `$${commissionSum.toFixed(2)}` },
        { label: "Referral rewards converted", value: `$${referralSum.toFixed(2)}` },
        { label: "Referred bet volume", value: `$${betSum.toFixed(2)}` },
        { label: "Referred win volume", value: `$${winSum.toFixed(2)}` },
      ]);

      toast({ title: "Affiliate dashboard loaded" });
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    }
  }

  React.useEffect(() => { load(); }, []);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Affiliate Dashboard</h1>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Rows</div>
              <Input className="h-9 w-24" type="number" value={rowsPerPage} onChange={(e)=> setRowsPerPage(Math.max(1, Number(e.target.value)||2000))} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Start</div>
              <Input className="h-9 w-56" type="date" value={startDate.toISOString().slice(0,10)} onChange={(e)=>{ const v=e.target.value; if (v) setStartDate(new Date(`${v}T00:00:00`)); }} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">End</div>
              <Input className="h-9 w-56" type="date" value={endDate.toISOString().slice(0,10)} onChange={(e)=>{ const v=e.target.value; if (v) setEndDate(new Date(`${v}T00:00:00`)); }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">All time</div>
              <Switch checked={allTime} onCheckedChange={(v)=> setAllTime(Boolean(v))} />
            </div>
            <Button onClick={load}>Search</Button>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m)=> (
            <Card key={m.label}>
              <CardHeader><CardTitle className="text-base">{m.label}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{typeof m.value === "number" ? m.value : m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Commission Conversions</CardTitle></CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionTx.map((t: any) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-mono text-xs">{t._id}</TableCell>
                        <TableCell>{t.user?.username || t.userId}</TableCell>
                        <TableCell>{Number(t.amount).toFixed(2)}</TableCell>
                        <TableCell>{t.currencyName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent Referral Conversions</CardTitle></CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralTx.map((t: any) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-mono text-xs">{t._id}</TableCell>
                        <TableCell>{t.user?.username || t.userId}</TableCell>
                        <TableCell>{Number(t.amount).toFixed(2)}</TableCell>
                        <TableCell>{t.currencyName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
