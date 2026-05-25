import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import React from "react";
import { getUsers } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

const token = () => getAdminToken() || "";

type UserRow = {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
  inviteCode?: string;
  invitorId?: string;
};

type UsersResp = { data: UserRow[]; total: number };

export default function AdminAffiliateSignups() {
  const [status, setStatus] = React.useState<string>("all");
  const [username, setUsername] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(20);
  const [startDate, setStartDate] = React.useState<Date>(new Date(Date.now() - 7 * 864e5));
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [isAll, setIsAll] = React.useState<boolean>(false);

  const [items, setItems] = React.useState<UserRow[]>([]);
  const [total, setTotal] = React.useState<number>(0);

  const pages = Math.max(1, Math.ceil(total / rowsPerPage));

  function parseUsers(resp: any): { list: UserRow[]; total: number } {
    const arr = (resp?.data || resp?.results || resp || []) as any[];
    const list = arr.filter((u: any) => Boolean(u?.inviteCode || u?.invitorId));
    const total = Number(resp?.total || resp?.totalResults || list.length) || list.length;
    return { list, total };
  }

  async function load() {
    try {
      const common: any = { username, currentPage, rowsPerPage, isAll };
      if (!isAll) common.date = { start: startDate.toISOString(), end: endDate.toISOString() };

      if (status === "all") {
        const [a, b] = await Promise.all([
          getUsers({ ...common, status: "active" }, token()),
          getUsers({ ...common, status: "blocked" }, token()),
        ]);
        const pa = parseUsers(a);
        const pb = parseUsers(b);
        const merged = [...pa.list, ...pb.list].filter(Boolean);
        const dedup = Array.from(new Map(merged.map((u) => [u._id, u])).values());
        dedup.sort((x: any, y: any) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
        setItems(dedup);
        setTotal((pa.total || pa.list.length) + (pb.total || pb.list.length));
      } else {
        const data: any = await getUsers({ ...common, status }, token());
        const { list, total } = parseUsers(data);
        setItems(list);
        setTotal(total);
      }

      toast({ title: "Affiliate signups loaded" });
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    }
  }

  React.useEffect(() => { if (token()) load(); }, []);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Affiliate Signups</h1>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <Select value={status} onValueChange={(v)=>setStatus(v)}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="blocked">blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Username</div>
              <Input className="h-9 w-48" value={username} onChange={(e)=>setUsername(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rows</div>
              <Input className="h-9 w-24" type="number" value={rowsPerPage} onChange={(e)=> setRowsPerPage(Math.max(1, Number(e.target.value)||20))} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Page</div>
              <Input className="h-9 w-24" type="number" value={currentPage} onChange={(e)=> setCurrentPage(Math.max(1, Number(e.target.value)||1))} />
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
              <Switch checked={isAll} onCheckedChange={(v)=>setIsAll(Boolean(v))} />
            </div>
            <Button onClick={load}>Search</Button>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Users registered via affiliate</CardTitle></CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Invite Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((u)=> (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="font-mono text-xs">{u.inviteCode}</TableCell>
                      <TableCell>
                        <Badge className={u.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : u.status === "blocked" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {items.length===0 && (
                    <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No affiliate signups</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="ml-auto mt-2 flex items-center gap-2">
              <Button variant="outline" disabled={currentPage<=1} onClick={()=>{ setCurrentPage(p=>Math.max(1,p-1)); setTimeout(load,0); }}>Prev</Button>
              <div className="text-sm text-muted-foreground">{currentPage} / {pages}</div>
              <Button variant="outline" onClick={()=>{ setCurrentPage(p=>p+1); setTimeout(load,0); }}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
