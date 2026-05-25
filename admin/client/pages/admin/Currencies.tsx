import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { getAdminCurrencies, createCurrencyApi, updateCurrencyApi, deleteCurrencyApi, getRates as getRatesApi, updateRates as updateRatesApi, syncRates as syncRatesApi, listNowpayCurrencies, loadNowpayCurrencies, updateNowpayCurrencyStatus, type NowpayCurrency } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

const token = () => getAdminToken() || "";

type Currency = {
  _id: string;
  name: string;
  icon: string;
  status: boolean;
  createdAt: string;
};

type Rates = Record<string, number>;

export default function AdminCurrencies() {
  const [rows, setRows] = React.useState<Currency[]>([]);
  const [loading, setLoading] = React.useState(false);

  // NowPayments currencies
  const [npRows, setNpRows] = React.useState<NowpayCurrency[]>([]);
  const [npTotal, setNpTotal] = React.useState<number>(0);
  const [npPage, setNpPage] = React.useState<number>(1);
  const [npPerPage, setNpPerPage] = React.useState<number>(20);
  const [npHasBalance, setNpHasBalance] = React.useState<boolean | undefined>(undefined);
  const [npStatus, setNpStatus] = React.useState<boolean | undefined>(undefined);
  const [npIsAll, setNpIsAll] = React.useState<boolean>(true);
  const [npBusyId, setNpBusyId] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newIcon, setNewIcon] = React.useState("");
  const [newActive, setNewActive] = React.useState(true);

  const [rates, setRates] = React.useState<Rates>({});
  const [rateKey, setRateKey] = React.useState("");
  const [rateValue, setRateValue] = React.useState<string>("");

  async function loadCurrencies() {
    setLoading(true);
    try {
      const data = await getAdminCurrencies(token());
      setRows((data as any) || []);
      toast({ title: "Currencies loaded" });
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadRates() {
    try {
      const data = await getRatesApi(token());
      setRates(data || {} as any);
    } catch (e: any) {
      toast({ title: "Load rates failed", description: e?.message || "", variant: "destructive" });
    }
  }

  React.useEffect(() => { loadCurrencies(); loadRates(); }, []);

  async function loadNowpayList() {
    try {
      const data = await listNowpayCurrencies({ hasBalance: npHasBalance, isAll: npIsAll, status: npStatus, currentPage: npPage, rowsPerPage: npPerPage }, token());
      setNpRows(data?.data || [] as any);
      setNpTotal(data?.total || 0);
      toast({ title: "NowPayments currencies loaded" });
    } catch (e: any) {
      toast({ title: "Load NowPayments failed", description: e?.message || "", variant: "destructive" });
    }
  }

  React.useEffect(() => { loadNowpayList(); }, []);

  function updateRow(idx: number, patch: Partial<Currency>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as Currency) : r)));
  }

  async function saveRow(idx: number) {
    const row = rows[idx];
    try {
      await updateCurrencyApi(row._id, { name: row.name, icon: row.icon, status: row.status }, token());
      toast({ title: "Saved" });
      await loadCurrencies();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function removeRow(id: string) {
    try {
      await deleteCurrencyApi(id, token());
      toast({ title: "Deleted" });
      await loadCurrencies();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function createCurrency(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCurrencyApi({ name: newName.toUpperCase(), icon: newIcon, status: newActive }, token());
      toast({ title: "Currency created" });
      setNewName(""); setNewIcon(""); setNewActive(true);
      await loadCurrencies();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function addOrUpdateRate() {
    if (!rateKey || !rateValue) return;
    const value = Number(rateValue);
    if (!isFinite(value) || value <= 0) { toast({ title: "Invalid rate", variant: "destructive" }); return; }
    try {
      const updated = await updateRatesApi({ [rateKey.toUpperCase()]: value }, token());
      setRates(updated || {} as any);
      toast({ title: "Rate saved" });
      setRateKey(""); setRateValue("");
    } catch (e: any) {
      toast({ title: "Update rates failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function syncRates() {
    try {
      const updated = await syncRatesApi(token());
      setRates(updated || {} as any);
      toast({ title: "Rates synced" });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Currency Management</h1>
          <Button variant="outline" onClick={()=>{ loadCurrencies(); loadRates(); }} disabled={loading}>{loading?"Loading...":"Refresh"}</Button>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle className="text-base">Currencies</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <form onSubmit={createCurrency} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input placeholder="Code (e.g. USD)" value={newName} onChange={(e)=>setNewName(e.target.value)} required />
                <Input placeholder="Icon (URL or class)" value={newIcon} onChange={(e)=>setNewIcon(e.target.value)} required />
                <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Active</span><Switch checked={newActive} onCheckedChange={(v)=>setNewActive(Boolean(v))} /></div>
                <div className="md:col-span-2"><Button type="submit">Add Currency</Button></div>
              </form>

              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((c, idx) => (
                      <TableRow key={c._id}>
                        <TableCell className="min-w-28"><Input value={c.name} onChange={(e)=>updateRow(idx,{name:e.target.value.toUpperCase()})} /></TableCell>
                        <TableCell className="min-w-56"><Input value={c.icon} onChange={(e)=>updateRow(idx,{icon:e.target.value})} /></TableCell>
                        <TableCell className="min-w-28"><div className="flex items-center gap-2 text-xs text-muted-foreground">Active<Switch checked={c.status} onCheckedChange={(v)=>updateRow(idx,{status:Boolean(v)})} /></div></TableCell>
                        <TableCell className="text-xs text-muted-foreground min-w-40">{new Date(c.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="min-w-40">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={()=>saveRow(idx)}>Save</Button>
                            <Button size="sm" variant="destructive" onClick={()=>removeRow(c._id)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length===0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-muted-foreground">No currencies</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">NowPayments Currencies</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Has balance</div>
                  <select className="h-9 w-28 rounded border bg-background px-2 text-sm" value={String(npHasBalance)} onChange={(e)=>setNpHasBalance(e.target.value === "undefined" ? undefined : e.target.value === "true")}>
                    <option value="undefined">all</option>
                    <option value="true">yes</option>
                    <option value="false">no</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <select className="h-9 w-28 rounded border bg-background px-2 text-sm" value={String(npStatus)} onChange={(e)=>setNpStatus(e.target.value === "undefined" ? undefined : e.target.value === "true")}>
                    <option value="undefined">all</option>
                    <option value="true">active</option>
                    <option value="false">inactive</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rows</div>
                  <Input className="h-9 w-24" type="number" value={npPerPage} onChange={(e)=> setNpPerPage(Math.max(1, Number(e.target.value)||20))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Page</div>
                  <Input className="h-9 w-24" type="number" value={npPage} onChange={(e)=> setNpPage(Math.max(1, Number(e.target.value)||1))} />
                </div>
                <Button onClick={loadNowpayList}>Search</Button>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" disabled={npPage<=1} onClick={()=>{ setNpPage(p=>Math.max(1,p-1)); setTimeout(loadNowpayList,0); }}>Prev</Button>
                  <div className="text-sm text-muted-foreground">{npPage} / {Math.max(1, Math.ceil(npTotal/npPerPage))}</div>
                  <Button variant="outline" disabled={npPage>=Math.max(1, Math.ceil(npTotal/npPerPage))} onClick={()=>{ setNpPage(p=>p+1); setTimeout(loadNowpayList,0); }}>Next</Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={async ()=>{ await loadNowpayCurrencies(); await loadNowpayList(); }}>Sync NowPayments</Button>
              </div>

              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>USD</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {npRows.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell className="min-w-24">{c.code}</TableCell>
                        <TableCell className="min-w-40">{c.name}</TableCell>
                        <TableCell className="min-w-28">{c.network || "-"}</TableCell>
                        <TableCell className="min-w-24">{typeof c.usd === "number" ? c.usd.toFixed(4) : "-"}</TableCell>
                        <TableCell className="min-w-24 text-xs text-muted-foreground">{c.status ? "active" : "inactive"}</TableCell>
                        <TableCell className="min-w-28">
                          <Button
                            size="sm"
                            variant={c.status ? "destructive" : "default"}
                            disabled={npBusyId === c._id}
                            onClick={async () => {
                              try {
                                setNpBusyId(c._id);
                                const updated = await updateNowpayCurrencyStatus(c._id, !Boolean(c.status), token());
                                setNpRows((prev) => prev.map((r) => (r._id === c._id ? { ...r, status: updated?.status ?? !Boolean(c.status) } : r)));
                                await loadCurrencies();
                                toast({ title: updated?.status ? "Activated" : "Deactivated" });
                              } catch (e: any) {
                                toast({ title: "Update failed", description: e?.message || "", variant: "destructive" });
                              } finally {
                                setNpBusyId(null);
                              }
                            }}
                          >
                            {c.status ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {npRows.length===0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-sm text-muted-foreground">No NowPayments currencies</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Exchange Rates (base USD)</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="Code (e.g. EUR)" value={rateKey} onChange={(e)=>setRateKey(e.target.value)} />
                <Input placeholder="Rate" value={rateValue} onChange={(e)=>setRateValue(e.target.value)} />
                <Button onClick={addOrUpdateRate}>Save Rate</Button>
              </div>
              <Button variant="outline" onClick={syncRates}>Sync from API</Button>
              {Object.keys(rates).length ? (
                <div className="rounded border max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(rates).sort(([a],[b])=>a.localeCompare(b)).map(([code, val]) => (
                        <TableRow key={code}>
                          <TableCell className="font-mono text-xs">{code}</TableCell>
                          <TableCell>{Number(val).toFixed(6)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded border p-2 text-sm text-muted-foreground">No rates loaded</div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
