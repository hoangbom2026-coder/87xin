import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Switch } from "@game/ui/switch";
import { Badge } from "@game/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@game/ui/dialog";
import React from "react";
import { toast } from "@game/ui/use-toast";
import { getPreference, updatePreference, getAdminCurrencies, replaceUser } from "@/lib/api";
import { adminMe, getAdminToken } from "@/lib/adminAuth";

export default function AdminPreference() {
  const [data, setData] = React.useState<any | null>(null);
  // raw JSON editor removed; using readable UI only
  const [loading, setLoading] = React.useState(false);

  const [initNeeded, setInitNeeded] = React.useState(false);
  const [currencies, setCurrencies] = React.useState<Array<{ _id: string; name: string }>>([]);
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("");
  const [me, setMe] = React.useState<any | null>(null);

  const token = React.useMemo(() => getAdminToken() || "", []);

  async function load() {
    setLoading(true);
    try {
      const res = await getPreference(token);
      setData(res || {});
      setInitNeeded(false);
      toast({ title: "Preferences loaded" });
    } catch (e: any) {
      setData(null);
      const msg = String(e?.message || "");
      if (/Cast to ObjectId failed/.test(msg) || /currenc/i.test(msg)) {
        setInitNeeded(true);
        try {
          const m = await adminMe(token);
          setMe(m?.user || null);
        } catch {}
        try {
          const list = await getAdminCurrencies(token);
          const arr = (list as any[] || []).map((c: any) => ({ _id: c._id, name: c.name }));
          setCurrencies(arr);
          if (!selectedCurrency && arr.length) setSelectedCurrency(arr[0]._id);
        } catch {}
      }
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function labelize(key: string) {
    return key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  function isIsoDateString(v: any) {
    return typeof v === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.+)?Z?/.test(v);
  }

  function formatValue(v: any): React.ReactNode {
    if (typeof v === "boolean") return <Badge variant={v ? "default" : "secondary"}>{v ? "Enabled" : "Disabled"}</Badge>;
    if (typeof v === "number") return <span>{new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(v)}</span>;
    if (isIsoDateString(v)) return <span>{new Date(v).toLocaleString()}</span>;
    if (typeof v === "string") return <span className="break-all">{v || "—"}</span>;
    if (Array.isArray(v)) return <span>{v.length} items</span>;
    if (v && typeof v === "object") return <span>Details</span>;
    return <span>—</span>;
  }

  function RenderDetails({ value }: { value: any }) {
    if (Array.isArray(value)) {
      return (
        <div className="grid gap-2">
          {value.map((item, idx) => (
            <div key={idx} className="rounded border p-2">
              <RenderDetails value={item} />
            </div>
          ))}
        </div>
      );
    }
    if (value && typeof value === "object") {
      const ents = Object.entries(value as Record<string, any>);
      return (
        <div className="grid gap-2">
          {ents.map(([k, v]) => (
            <div key={k} className="grid gap-1">
              <div className="text-xs text-muted-foreground">{labelize(k)}</div>
              <div className="text-sm">{typeof v === "object" ? <RenderDetails value={v} /> : formatValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <div className="text-sm">{formatValue(value)}</div>;
  }

  function updateField(k: string, v: any) {
    setData((prev: any) => ({ ...(prev || {}), [k]: v }));
  }

  async function initializeCurrency() {
    if (!me?._id || !selectedCurrency) return;
    try {
      await replaceUser(me._id, { currencyId: selectedCurrency }, token);
      toast({ title: "Currency set" });
      await load();
    } catch (e: any) {
      toast({ title: "Init failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function save() {
    try {
      await updatePreference(data ?? {}, token);
      toast({ title: "Preferences updated" });
      await load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "", variant: "destructive" });
    }
  }


  const entries = data && typeof data === "object" ? Object.entries(data as Record<string, any>) : [];
  const currency = (data as any)?.currency || null;
  const omitKeys = new Set(["_id", "userId", "currency", "__v", "createdAt", "updatedAt"]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-xl">Site Preferences</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>{loading?"Loading...":"Refresh"}</Button>
          <Button onClick={save} disabled={!data}>Save</Button>
        </div>
      </div>

      {initNeeded ? (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Initialize Preferences</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <div className="text-sm text-muted-foreground">Your account needs a default currency to load preferences.</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Select Currency</div>
                <select className="h-9 w-full rounded border bg-background px-2 text-sm" value={selectedCurrency} onChange={(e)=>setSelectedCurrency(e.target.value)}>
                  {currencies.map((c)=> (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={initializeCurrency} disabled={!selectedCurrency}>Save</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
          <Card className="xl:col-span-1">
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="grid gap-1">
                <div className="text-xs text-muted-foreground">Currency</div>
                <div>{currency?.name ? <Badge>{currency.name}</Badge> : <span className="text-muted-foreground">Not set</span>}</div>
              </div>
              {data?.createdAt && (
                <div className="grid gap-1">
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div>{formatValue((data as any).createdAt)}</div>
                </div>
              )}
              {data?.updatedAt && (
                <div className="grid gap-1">
                  <div className="text-xs text-muted-foreground">Updated</div>
                  <div>{formatValue((data as any).updatedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader><CardTitle className="text-base">Editable Fields</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {entries.length ? (
                entries.filter(([k]) => !omitKeys.has(k)).map(([k, v]) => (
                  <div key={k} className="rounded border p-3 grid gap-1">
                    <div className="text-xs text-muted-foreground">{labelize(k)}</div>
                    {typeof v === "boolean" ? (
                      <div className="flex items-center gap-2 text-sm">
                        {formatValue(v)}
                        <Switch checked={v} onCheckedChange={(nv)=>updateField(k, Boolean(nv))} />
                      </div>
                    ) : typeof v === "number" ? (
                      <Input type="number" value={String(v)} onChange={(e)=>updateField(k, Number(e.target.value)||0)} />
                    ) : typeof v === "string" ? (
                      <Input value={v} onChange={(e)=>updateField(k, e.target.value)} />
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{Array.isArray(v) ? `${v.length} items` : "Complex value"}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">View</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{labelize(k)}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-auto">
                              <RenderDetails value={v} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
