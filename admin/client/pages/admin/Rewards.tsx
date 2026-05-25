import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { toast } from "@/components/ui/use-toast";
import {
  getRewardStatus,
  getRewardDashboard,
  getRewardActivity,
  getRewardLog,
  convertReward,
  listTransactions,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

const token = () => getAdminToken() || "";

export default function AdminRewards() {
  const [status, setStatus] = React.useState<any | null>(null);
  const [dashboard, setDashboard] = React.useState<any | null>(null);
  const [activity, setActivity] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any>({ data: [], total: 0 });
  const [page, setPage] = React.useState(1);
  const perPage = 20;
  const pages = Math.max(1, Math.ceil((logs?.total||0)/perPage));

  const [txnType, setTxnType] = React.useState<"commission" | "referral">("commission");
  const [payoutProv, setPayoutProv] = React.useState<"all" | "auto-payout" | "manual">("all");
  const [txns, setTxns] = React.useState<{ data: any[]; total: number }>({ data: [], total: 0 });
  const [txnPage, setTxnPage] = React.useState(1);
  const txnPerPage = 20;
  const txnPages = Math.max(1, Math.ceil((txns?.total || 0) / txnPerPage));

  async function loadAll() {
    try {
      const t = token();
      const [s, d, a, l, tx] = await Promise.all([
        getRewardStatus(t),
        getRewardDashboard(t),
        getRewardActivity(t),
        getRewardLog({ type: "commission", currentPage: page, rowsPerPage: perPage }, t),
        listTransactions(
          {
            type: txnType,
            payoutProvider: payoutProv,
            currentPage: txnPage,
            rowsPerPage: txnPerPage,
          },
          t,
        ),
      ]);
      setStatus(s || null);
      setDashboard(d || null);
      setActivity(a || []);
      setLogs(l || { data: [], total: 0 });
      setTxns(tx || { data: [], total: 0 });
      toast({ title: "Rewards loaded" });
    } catch (e:any) {
      toast({ title: "Load failed", description: e?.message||"", variant: "destructive" });
    }
  }

  function labelize(key: string) {
    return key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  function formatVal(v: any) {
    if (v === null || typeof v === "undefined") return "-";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
    if (typeof v === "string") return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) ? new Date(v).toLocaleString() : v;
    return v;
  }

  React.useEffect(()=>{ loadAll(); }, [page, txnPage, txnType, payoutProv]);

  async function convert(type: 'commission'|'referral') {
    try {
      await convertReward(type, token());
      toast({ title: type==="commission"?"Commission converted":"Referral converted" });
      await loadAll();
    } catch (e:any) {
      toast({ title: "Convert failed", description: e?.message||"", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Rewards</h1>
          <Button variant="outline" onClick={loadAll}>Refresh</Button>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent>
              {status ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border p-2"><div className="text-xs text-muted-foreground">Commission reward</div><div className="font-medium">{Number(status.commissionReward||0).toFixed(2)}</div></div>
                  <div className="rounded border p-2"><div className="text-xs text-muted-foreground">Commission available</div><div className="font-medium">{Number(status.commissionAvailable||0).toFixed(2)}</div></div>
                  <div className="rounded border p-2"><div className="text-xs text-muted-foreground">Referral reward</div><div className="font-medium">{Number(status.referralReward||0).toFixed(2)}</div></div>
                  <div className="rounded border p-2"><div className="text-xs text-muted-foreground">Referral available</div><div className="font-medium">{Number(status.referralAvailable||0).toFixed(2)}</div></div>
                </div>
              ) : (<div className="text-sm text-muted-foreground">No data</div>)}
              <div className="mt-3 flex gap-2">
                <Button onClick={()=>convert('commission')}>Convert commission</Button>
                <Button variant="outline" onClick={()=>convert('referral')}>Convert referral</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dashboard</CardTitle></CardHeader>
            <CardContent>
              {dashboard ? (
                <div className="grid gap-2">
                  {dashboard.code && (
                    <div className="flex items-center justify-between rounded border p-2 text-sm">
                      <div className="text-xs text-muted-foreground">Last code</div>
                      <div className="font-mono text-xs">{dashboard.code}</div>
                    </div>
                  )}
                  {typeof dashboard.friends !== 'undefined' && (
                    <div className="flex items-center justify-between rounded border p-2 text-sm">
                      <div className="text-xs text-muted-foreground">Friends</div>
                      <div className="font-medium">{dashboard.friends}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(dashboard).filter(([k]) => k !== 'code' && k !== 'friends').map(([k, v]) => (
                      <div key={k} className="rounded border p-2 text-sm">
                        <div className="text-xs text-muted-foreground">{labelize(k)}</div>
                        <div className="font-medium">{typeof v === 'number' ? formatVal(v) : String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
            <CardContent>
              {activity && activity.length ? (
                <div className="relative w-full overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="px-2 py-1 text-left">Time</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Amount</th>
                        <th className="px-2 py-1 text-left">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((a:any, idx:number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                          <td className="px-2 py-1">{a.type || a.action || '-'}</td>
                          <td className="px-2 py-1">{typeof a.amount === 'number' ? a.amount.toFixed(2) : (a.amount || '-')}</td>
                          <td className="px-2 py-1 text-xs text-muted-foreground">{a.description || a.note || a.message || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No activity</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Reward Logs</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {logs?.data?.length ? (
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="px-2 py-1 text-left">Time</th>
                      <th className="px-2 py-1 text-left">Type</th>
                      <th className="px-2 py-1 text-left">Amount</th>
                      <th className="px-2 py-1 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.data.map((r:any, idx:number) => (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                        <td className="px-2 py-1">{r.type || r.action || '-'}</td>
                        <td className="px-2 py-1">{typeof r.amount === 'number' ? r.amount.toFixed(2) : (r.amount || '-')}</td>
                        <td className="px-2 py-1 text-xs text-muted-foreground">{r.description || r.note || r.message || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No logs</div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
              <div className="text-sm text-muted-foreground">{page} / {pages}</div>
              <Button variant="outline" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Giao dịch chi thưởng (balance)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select
                value={txnType}
                onValueChange={(v) => {
                  setTxnType(v as "commission" | "referral");
                  setTxnPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">commission</SelectItem>
                  <SelectItem value="referral">referral</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={payoutProv}
                onValueChange={(v) => {
                  setPayoutProv(v as typeof payoutProv);
                  setTxnPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[200px]">
                  <SelectValue placeholder="Nguồn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="auto-payout">auto-payout</SelectItem>
                  <SelectItem value="manual">manual / khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {txns?.data?.length ? (
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="px-2 py-1 text-left">Time</th>
                      <th className="px-2 py-1 text-left">User</th>
                      <th className="px-2 py-1 text-left">Type</th>
                      <th className="px-2 py-1 text-left">Provider</th>
                      <th className="px-2 py-1 text-left">Amount</th>
                      <th className="px-2 py-1 text-left">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.data.map((r: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                        <td className="px-2 py-1">{r.user?.username || '-'}</td>
                        <td className="px-2 py-1">{r.type || '-'}</td>
                        <td className="px-2 py-1 font-mono text-xs">{r.provider || '-'}</td>
                        <td className="px-2 py-1">{typeof r.amount === 'number' ? r.amount.toFixed(2) : (r.amount || '-')}</td>
                        <td className="px-2 py-1 text-xs text-muted-foreground">{r.typeDescription || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No transactions</div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" disabled={txnPage<=1} onClick={()=>setTxnPage(p=>Math.max(1,p-1))}>Prev</Button>
              <div className="text-sm text-muted-foreground">{txnPage} / {txnPages}</div>
              <Button variant="outline" disabled={txnPage>=txnPages} onClick={()=>setTxnPage(p=>p+1)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
