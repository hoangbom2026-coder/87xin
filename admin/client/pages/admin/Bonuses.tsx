import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { toast } from "@/components/ui/use-toast";
import { getAdminBonuses, createBonusApi, updateBonusApi, deleteBonusApi } from "@/lib/api";

import { getAdminToken } from "@/lib/adminAuth";
const token = () => getAdminToken() || "";
const envBase =
  ((import.meta as any).env?.VITE_HOST_API as string | undefined) ||
  ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined) ||
  ((import.meta as any).env?.VITE_LOCAL_HOST_API as string | undefined) ||
  "";
const lsBase =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("__API_BASE")
    : null;
const winBase =
  (typeof window !== "undefined" && (window as any).__API_BASE) || undefined;
const originApi =
  typeof window !== "undefined" ? `${window.location.origin}/api` : undefined;
function normalizeBase(b?: string | null) {
  if (!b) return undefined;
  let t = String(b).trim();
  if (!t) return undefined;
  t = t.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(t) && !/\/api$/i.test(t)) t = `${t}/api`;
  return t;
}
const API_BASE = normalizeBase(lsBase) || normalizeBase(winBase) || normalizeBase(envBase) || originApi || "/api";
const ASSET_HOST = (API_BASE || "").replace(/\/+api\/?$/, "");

type Bonus = {
  _id: string;
  name: string;
  percent: number;
  multiply: number;
  option: string;
  bonusCap: number;
  minBet: number;
  maxBet: number;
  slot: boolean;
  casino: boolean;
  status: boolean;
  autoCalc: boolean;
  expireDate: string;
  banner?: string;
  description: string;
  particularData?: any;
  createdAt: string;
};

export default function Bonuses() {
  const [rows, setRows] = React.useState<Bonus[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [createData, setCreateData] = React.useState({
    name: "",
    percent: 0,
    multiply: 0,
    option: "deposit",
    bonusCap: 0,
    minBet: 0,
    maxBet: 0,
    slot: false,
    casino: true,
    status: true,
    autoCalc: false,
    expireDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
    description: "",
    particularData: "",
  });
  const [createFile, setCreateFile] = React.useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data: any = await getAdminBonuses(token());
      const list: Bonus[] = Array.isArray(data) ? data : (data?.results || data?.data || []);
      setRows(list || []);
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function updateRow(idx: number, patch: Partial<Bonus>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as Bonus) : r)));
  }

  async function saveRow(idx: number, file?: File | null) {
    const row = rows[idx];
    try {
      await updateBonusApi(row._id, {
        name: row.name,
        percent: row.percent,
        multiply: row.multiply,
        option: row.option,
        bonusCap: row.bonusCap,
        minBet: row.minBet,
        maxBet: row.maxBet,
        slot: row.slot,
        casino: row.casino,
        status: row.status,
        autoCalc: row.autoCalc,
        expireDate: (row.expireDate || '').slice(0,10),
        description: row.description || "",
        particularData: row.particularData,
        file: file || undefined,
      }, token());
      toast({ title: "Saved" });
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function deleteRow(id: string) {
    try {
      await deleteBonusApi(id, token());
      toast({ title: "Deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function createBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!createFile) {
      toast({ title: "Image required", description: "Please upload a banner image.", variant: "destructive" });
      return;
    }
    if (!createData.description.trim()) {
      toast({ title: "Description required", description: "Please add a description.", variant: "destructive" });
      return;
    }
    let pd: any | undefined = undefined;
    if (createData.particularData && String(createData.particularData).trim()) {
      try { pd = JSON.parse(String(createData.particularData)); }
      catch { toast({ title: "Invalid particular data", description: "Must be valid JSON.", variant: "destructive" }); return; }
    }
    try {
      await createBonusApi({
        name: createData.name,
        percent: createData.percent,
        multiply: createData.multiply,
        option: createData.option,
        bonusCap: createData.bonusCap,
        minBet: createData.minBet,
        maxBet: createData.maxBet,
        slot: createData.slot,
        casino: createData.casino,
        status: createData.status,
        autoCalc: createData.autoCalc,
        expireDate: createData.expireDate,
        description: createData.description,
        particularData: pd,
        file: createFile,
      }, token());
      toast({ title: "Bonus created" });
      setCreateData({
        name: "",
        percent: 0,
        multiply: 0,
        option: "deposit",
        bonusCap: 0,
        minBet: 0,
        maxBet: 0,
        slot: false,
        casino: true,
        status: true,
        autoCalc: false,
        expireDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
        description: "",
        particularData: "",
      });
      setCreateFile(null);
      await load();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold md:text-xl">Bonuses</h1>
          <Button variant="outline" onClick={load} disabled={loading}>{loading?"Loading...":"Refresh"}</Button>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Create Bonus</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createBonus} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Input placeholder="Name" value={createData.name} onChange={(e)=>setCreateData({...createData, name:e.target.value})} required />
              <Input type="number" placeholder="Percent" value={createData.percent} onChange={(e)=>setCreateData({...createData, percent:Number(e.target.value)||0})} required />
              <Input type="number" placeholder="Multiply" value={createData.multiply} onChange={(e)=>setCreateData({...createData, multiply:Number(e.target.value)||0})} required />
              <Select value={createData.option} onValueChange={(v)=>setCreateData({...createData, option:v})}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Option" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">deposit</SelectItem>
                  <SelectItem value="signup">signup</SelectItem>
                  <SelectItem value="vip">vip</SelectItem>
                  <SelectItem value="cashback">cashback</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Bonus Cap" value={createData.bonusCap} onChange={(e)=>setCreateData({...createData, bonusCap:Number(e.target.value)||0})} required />
              <Input type="number" placeholder="Min Bet" value={createData.minBet} onChange={(e)=>setCreateData({...createData, minBet:Number(e.target.value)||0})} required />
              <Input type="number" placeholder="Max Bet" value={createData.maxBet} onChange={(e)=>setCreateData({...createData, maxBet:Number(e.target.value)||0})} required />
              <div className="flex items-center justify-between sm:justify-start gap-2"><span className="text-xs text-muted-foreground">Slot</span><Switch checked={createData.slot} onCheckedChange={(v)=>setCreateData({...createData, slot:Boolean(v)})} /></div>
              <div className="flex items-center justify-between sm:justify-start gap-2"><span className="text-xs text-muted-foreground">Casino</span><Switch checked={createData.casino} onCheckedChange={(v)=>setCreateData({...createData, casino:Boolean(v)})} /></div>
              <div className="flex items-center justify-between sm:justify-start gap-2"><span className="text-xs text-muted-foreground">Active</span><Switch checked={createData.status} onCheckedChange={(v)=>setCreateData({...createData, status:Boolean(v)})} /></div>
              <div className="flex items-center justify-between sm:justify-start gap-2"><span className="text-xs text-muted-foreground">Auto Calc</span><Switch checked={createData.autoCalc} onCheckedChange={(v)=>setCreateData({...createData, autoCalc:Boolean(v)})} /></div>
              <div>
                <div className="text-xs text-muted-foreground">Expire Date</div>
                <Input type="date" value={createData.expireDate} onChange={(e)=>setCreateData({...createData, expireDate:e.target.value})} required />
              </div>
              <div className="sm:col-span-2 md:col-span-2">
                <Textarea placeholder="Description" value={createData.description} onChange={(e)=>setCreateData({...createData, description:e.target.value})} required />
              </div>
              <div className="sm:col-span-2 md:col-span-2">
                <Textarea placeholder="Particular Data (JSON or text)" value={createData.particularData} onChange={(e)=>setCreateData({...createData, particularData:e.target.value})} />
              </div>
              <Input type="file" accept="image/*" onChange={(e)=>setCreateFile(e.target.files?.[0]||null)} required className="w-full sm:col-span-2" />
              <div className="col-span-full"><Button type="submit" className="w-full sm:w-auto">Create</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Existing Bonuses</CardTitle></CardHeader>
          <CardContent>
            <div className="contents">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Option</TableHead>
                    <TableHead>Percent</TableHead>
                    <TableHead>Multiply</TableHead>
                    <TableHead>Cap</TableHead>
                    <TableHead>Min/Max Bet</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Expire</TableHead>
                    <TableHead>Banner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={r._id}>
                      <TableCell className="min-w-40">
                        <Input value={r.name} onChange={(e)=>updateRow(idx,{name:e.target.value})} />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <Select value={r.option} onValueChange={(v)=>updateRow(idx,{option:v})}>
                          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposit">deposit</SelectItem>
                            <SelectItem value="signup">signup</SelectItem>
                            <SelectItem value="vip">vip</SelectItem>
                            <SelectItem value="cashback">cashback</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input type="number" value={r.percent} onChange={(e)=>updateRow(idx,{percent:Number(e.target.value)||0})} />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input type="number" value={r.multiply} onChange={(e)=>updateRow(idx,{multiply:Number(e.target.value)||0})} />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input type="number" value={r.bonusCap} onChange={(e)=>updateRow(idx,{bonusCap:Number(e.target.value)||0})} />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex flex-wrap gap-2">
                          <Input className="w-full sm:w-24" type="number" value={r.minBet} onChange={(e)=>updateRow(idx,{minBet:Number(e.target.value)||0})} />
                          <Input className="w-full sm:w-24" type="number" value={r.maxBet} onChange={(e)=>updateRow(idx,{maxBet:Number(e.target.value)||0})} />
                        </div>
                      </TableCell>
                      <TableCell className="min-w-56">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">Slot<Switch checked={r.slot} onCheckedChange={(v)=>updateRow(idx,{slot:Boolean(v)})} /></div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">Casino<Switch checked={r.casino} onCheckedChange={(v)=>updateRow(idx,{casino:Boolean(v)})} /></div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">Active<Switch checked={r.status} onCheckedChange={(v)=>updateRow(idx,{status:Boolean(v)})} /></div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">AutoCalc<Switch checked={r.autoCalc} onCheckedChange={(v)=>updateRow(idx,{autoCalc:Boolean(v)})} /></div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <Input type="date" value={(r.expireDate||"").slice(0,10)} onChange={(e)=>updateRow(idx,{expireDate:e.target.value})} />
                      </TableCell>
                      <TableCell className="min-w-40">
                        {r.banner ? (
                          <img src={`${ASSET_HOST}/${r.banner}`} alt="banner" className="h-10 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-muted-foreground">No banner</span>
                        )}
                        <Input className="mt-2 w-full" type="file" accept="image/*" onChange={(e)=>saveRow(idx, e.target.files?.[0]||undefined)} />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={()=>saveRow(idx)}>Save</Button>
                          <Button size="sm" variant="destructive" onClick={()=>deleteRow(r._id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length===0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-sm text-muted-foreground">No bonuses</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
