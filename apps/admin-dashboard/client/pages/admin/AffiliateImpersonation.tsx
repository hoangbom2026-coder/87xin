import * as React from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Textarea } from "@game/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@game/ui/table";
import { toast } from "@game/ui/use-toast";
import { getAffiliateToken, setAffiliateToken, affiliateLogin, affiliateMe, affiliateLogout, clearAffiliateAuth } from "@/lib/affiliateAuth";
import {
  affiliateReferralCount,
  affiliateDashboard,
  affiliateDashboardAnalysis,
  affiliateUsers,
  affiliateCommission,
  affiliateUpdateCommission,
  affiliateTree,
  affiliateUpdate,
  affiliateUpdatePassword,
} from "@/lib/affiliateApi";

export default function AffiliateImpersonation() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
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
    if (t) {
      setToken(t);
      affiliateMe(t).then((m) => setMe(m)).catch(()=>{});
    }
  }, []);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await affiliateLogin(username.trim(), password);
      setAffiliateToken(res.accessToken);
      setToken(res.accessToken);
      const m = await affiliateMe(res.accessToken);
      setMe(m);
      toast({ title: "Impersonation active", description: `As ${m?.username || m?.email}` });
    } catch (e: any) {
      toast({ title: "Login failed", description: e?.message || "" , variant: "destructive"});
    }
  }

  async function doLogout() {
    try {
      if (token) await affiliateLogout(token);
    } catch {}
    clearAffiliateAuth();
    setToken(null);
    setMe(null);
    toast({ title: "Impersonation cleared" });
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
      toast({ title: "Affiliate data loaded" });
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function runAnalysis() {
    if (!token) return;
    try {
      const body = JSON.parse(analysisBody || "{}");
      const res = await affiliateDashboardAnalysis(body, token);
      setDashboard((d: any)=> ({ ...(d||{}), analysis: res }));
      toast({ title: "Analysis loaded" });
    } catch (e: any) {
      toast({ title: "Invalid JSON or error", description: e?.message || "", variant: "destructive" });
    }
  }

  async function loadUsers() {
    if (!token) return;
    try {
      const body = JSON.parse(usersBody || "{}");
      const res = await affiliateUsers(body, token);
      setUsers(res);
      toast({ title: "Users loaded" });
    } catch (e: any) {
      toast({ title: "Invalid JSON or error", description: e?.message || "", variant: "destructive" });
    }
  }

  async function saveCommission() {
    if (!token) return;
    try {
      const body = JSON.parse(commissionBody || "{}");
      const res = await affiliateUpdateCommission(body, token);
      setCommission(res);
      toast({ title: "Commission updated" });
    } catch (e: any) {
      toast({ title: "Invalid JSON or error", description: e?.message || "", variant: "destructive" });
    }
  }

  async function updateProfile(partial: Record<string, any>) {
    if (!token) return;
    try {
      const res = await affiliateUpdate(partial, token);
      setMe(res);
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    if (!token) return;
    try {
      await affiliateUpdatePassword({ oldPassword, newPassword }, token);
      toast({ title: "Password changed" });
    } catch (e: any) {
      toast({ title: "Change failed", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Affiliate Impersonation</h1>
          <div className="flex gap-2">
            {token ? (
              <Button variant="outline" onClick={doLogout}>End Impersonation</Button>
            ) : null}
            <Button variant="outline" onClick={loadBasics} disabled={!token}>Refresh</Button>
          </div>
        </div>

        {!token ? (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Login as Affiliate</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={doLogin} className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <Input placeholder="Affiliate username or email" value={username} onChange={(e)=> setUsername(e.target.value)} required className="w-full" />
                <Input placeholder="Password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} required className="w-full" />
                <Button type="submit" className="sm:col-span-2 md:col-span-1">Login</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Affiliate Profile</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                  <Input value={me?.username || ""} onChange={(e)=> setMe((m:any)=> ({...(m||{}), username: e.target.value }))} placeholder="username" />
                  <Input value={me?.email || ""} onChange={(e)=> setMe((m:any)=> ({...(m||{}), email: e.target.value }))} placeholder="email" />
                  <Input value={me?.firstName || ""} onChange={(e)=> setMe((m:any)=> ({...(m||{}), firstName: e.target.value }))} placeholder="first name" />
                  <Input value={me?.lastName || ""} onChange={(e)=> setMe((m:any)=> ({...(m||{}), lastName: e.target.value }))} placeholder="last name" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={()=> updateProfile({ username: me?.username, email: me?.email, firstName: me?.firstName, lastName: me?.lastName })}>Save Profile</Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input id="oldp" placeholder="Old password" type="password" />
                  <Input id="newp" placeholder="New password" type="password" />
                  <Button onClick={()=> {
                    const oldp = (document.getElementById("oldp") as HTMLInputElement)?.value || "";
                    const newp = (document.getElementById("newp") as HTMLInputElement)?.value || "";
                    changePassword(oldp, newp);
                  }}>Change Password</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <Input className="h-9 w-40" placeholder="all|7d|30d|..." value={duration} onChange={(e)=> setDuration(e.target.value)} />
                  </div>
                  <Button onClick={loadBasics}>Load</Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium mb-2">Referral Count</div>
                    <pre className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(refCount, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Dashboard</div>
                    <pre className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(dashboard, null, 2)}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Run Analysis (POST /dashboard/analysis)</CardTitle></CardHeader>
                <CardContent className="grid gap-2">
                  <Textarea className="min-h-[120px]" value={analysisBody} onChange={(e)=> setAnalysisBody(e.target.value)} />
                  <div className="flex justify-end"><Button onClick={runAnalysis}>Run</Button></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Affiliate Users (POST /users)</CardTitle></CardHeader>
                <CardContent className="grid gap-2">
                  <Textarea className="min-h-[120px]" value={usersBody} onChange={(e)=> setUsersBody(e.target.value)} />
                  <div className="flex justify-end"><Button onClick={loadUsers}>Load</Button></div>
                  {Array.isArray(users?.data) || Array.isArray(users) ? (
                    <div className="relative w-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Created</TableHead>
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
                <CardHeader><CardTitle className="text-base">Commission (GET/PUT /commission)</CardTitle></CardHeader>
                <CardContent className="grid gap-2">
                  <Textarea className="min-h-[160px]" placeholder="{...}" value={commissionBody} onChange={(e)=> setCommissionBody(e.target.value)} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={()=> setCommissionBody(JSON.stringify(commission ?? {}, null, 2))}>Load current</Button>
                    <Button onClick={saveCommission}>Save</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Tree Affiliates (GET /tree-affiliates)</CardTitle></CardHeader>
                <CardContent>
                  <pre className="rounded-md border p-3 text-xs overflow-auto max-h-[320px]">{JSON.stringify(tree, null, 2)}</pre>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
