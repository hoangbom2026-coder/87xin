import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import { toast } from "@/components/ui/use-toast";

const BASE = (import.meta as any).env?.VITE_BACKEND_URL || "/api";
import { getAdminToken } from "@/lib/adminAuth";
const token = () => getAdminToken() || "";

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

export function PromotionsPanel() {
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
      const res = await fetch(`${BASE}/bonus/list`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("Failed to load bonuses");
      const data = await res.json();
      setRows(data || []);
      toast({ title: "Bonuses loaded" });
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
    const form = new FormData();
    if (file) form.set("bonus", file);
    form.set("name", row.name);
    form.set("percent", String(row.percent));
    form.set("multiply", String(row.multiply));
    form.set("option", row.option);
    form.set("bonusCap", String(row.bonusCap));
    form.set("minBet", String(row.minBet));
    form.set("maxBet", String(row.maxBet));
    form.set("slot", String(row.slot));
    form.set("casino", String(row.casino));
    form.set("status", String(row.status));
    form.set("autoCalc", String(row.autoCalc));
    const dt = row.expireDate?.slice(0, 10);
    if (dt) form.set("expireDate", dt);
    form.set("description", row.description || "");
    if (row.particularData) form.set("particularData", typeof row.particularData === "string" ? row.particularData : JSON.stringify(row.particularData));

    try {
      const res = await fetch(`${BASE}/bonus/${row._id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token()}` }, body: form });
      if (!res.ok) throw new Error("Update failed");
      toast({ title: "Saved" });
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function deleteRow(id: string) {
    try {
      const res = await fetch(`${BASE}/bonus/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function createBonus(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();
    if (createFile) form.set("bonus", createFile);
    form.set("name", createData.name);
    form.set("percent", String(createData.percent));
    form.set("multiply", String(createData.multiply));
    form.set("option", createData.option);
    form.set("bonusCap", String(createData.bonusCap));
    form.set("minBet", String(createData.minBet));
    form.set("maxBet", String(createData.maxBet));
    form.set("slot", String(createData.slot));
    form.set("casino", String(createData.casino));
    form.set("status", String(createData.status));
    form.set("autoCalc", String(createData.autoCalc));
    form.set("expireDate", createData.expireDate);
    form.set("description", createData.description);
    if (createData.particularData) form.set("particularData", createData.particularData);

    try {
      const res = await fetch(`${BASE}/bonus`, { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: form });
      if (!res.ok) throw new Error("Create failed");
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
    <>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Promotions & Bonuses</h1>
          <Button variant="outline" onClick={load} disabled={loading}>{loading?"Loading...":"Refresh"}</Button>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Create Bonus</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createBonus} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Name" value={createData.name} onChange={(e)=>setCreateData({...createData, name:e.target.value})} required />
              <Input type="number" placeholder="Percent" value={createData.percent} onChange={(e)=>setCreateData({...createData, percent:Number(e.target.value)||0})} required />
              <Input type="number" placeholder="Multiply" value={createData.multiply} onChange={(e)=>setCreateData({...createData, multiply:Number(e.target.value)||0})} required />
              <Select value={createData.option} onValueChange={(v)=>setCreateData({...createData, option:v})}>
                <SelectTrigger><SelectValue placeholder="Option" /></SelectTrigger>
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
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Slot</span><Switch checked={createData.slot} onCheckedChange={(v)=>setCreateData({...createData, slot:Boolean(v)})} /></div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Casino</span><Switch checked={createData.casino} onCheckedChange={(v)=>setCreateData({...createData, casino:Boolean(v)})} /></div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Active</span><Switch checked={createData.status} onCheckedChange={(v)=>setCreateData({...createData, status:Boolean(v)})} /></div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Auto Calc</span><Switch checked={createData.autoCalc} onCheckedChange={(v)=>setCreateData({...createData, autoCalc:Boolean(v)})} /></div>
              <div>
                <div className="text-xs text-muted-foreground">Expire Date</div>
                <Input type="date" value={createData.expireDate} onChange={(e)=>setCreateData({...createData, expireDate:e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <Textarea placeholder="Description" value={createData.description} onChange={(e)=>setCreateData({...createData, description:e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <Textarea placeholder="Particular Data (JSON or text)" value={createData.particularData} onChange={(e)=>setCreateData({...createData, particularData:e.target.value})} />
              </div>
              <Input type="file" accept="image/*" onChange={(e)=>setCreateFile(e.target.files?.[0]||null)} />
              <div className="md:col-span-4"><Button type="submit">Create</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Existing Bonuses</CardTitle></CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <Table>
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
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                        <div className="flex gap-2">
                          <Input className="w-24" type="number" value={r.minBet} onChange={(e)=>updateRow(idx,{minBet:Number(e.target.value)||0})} />
                          <Input className="w-24" type="number" value={r.maxBet} onChange={(e)=>updateRow(idx,{maxBet:Number(e.target.value)||0})} />
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
                          <img src={`${BASE}/static/${r.banner}`} alt="banner" className="h-10 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-muted-foreground">No banner</span>
                        )}
                        <Input className="mt-2" type="file" accept="image/*" onChange={(e)=>saveRow(idx, e.target.files?.[0])} />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex gap-2">
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
    </>
  );
}

export default function Promotions() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <PromotionsPanel />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
