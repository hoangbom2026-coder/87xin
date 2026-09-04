import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Crown, Layers3, Gift } from "lucide-react";
import { getVipTiersList, getVipLevelsByParent, createVipTiersApi, updateVipTiersApi, deleteVipTiersApi, createVipLevelApi, updateVipLevelApi, deleteVipLevelApi, listVipSpinPrizes, createVipSpinPrize, updateVipSpinPrize, deleteVipSpinPrize } from "@/lib/api";

import { getAdminToken } from "@/lib/adminAuth";
const token = () => getAdminToken() || "";

// ---------- Types ----------
interface Tier {
  _id: string;
  tiersName: string;
  icon?: string;
  order: number;
  levelUpBonus: number;
  weeklyCashback: boolean;
  weeklyCashbackMin: number;
  weeklyCashbackPercent: number;
  monthlyCashback: boolean;
  monthlyCashbackMin: number;
  monthlyCashbackPercent: number;
  noFeeWithdrawal: boolean;
}

interface Level {
  _id: string;
  parentId: string;
  levelName: string;
  xp: number;
}

interface SpinSlotRow {
  id: string;
  amount: number;
  probability: number;
  label: string;
  minTurnover: number;
  minVipXp: number;
  minDepositCount: number;
}

interface SpinPrize {
  _id: string;
  tiersId: string;
  prizes: SpinSlotRow[];
}

function defaultPrizes(): SpinSlotRow[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: String(i + 1),
    amount: 0,
    probability: 0,
    label: "",
    minTurnover: 0,
    minVipXp: 0,
    minDepositCount: 0,
  }));
}

/** Gửi lên API: chỉ gửi field điều kiện khi > 0 để tránh ô bị khóa nhầm. */
function normalizeSpinSlots(rows: SpinSlotRow[]) {
  return rows.map((p) => ({
    id: String(p.id || ""),
    amount: Number(p.amount || 0),
    probability: Number(p.probability || 0),
    ...(String(p.label || "").trim() ? { label: String(p.label).trim() } : {}),
    ...(Number(p.minTurnover) > 0 ? { minTurnover: Number(p.minTurnover) } : {}),
    ...(Number(p.minVipXp) > 0 ? { minVipXp: Number(p.minVipXp) } : {}),
    ...(Number(p.minDepositCount) > 0
      ? { minDepositCount: Math.floor(Number(p.minDepositCount)) }
      : {}),
  }));
}


export default function VIP() {
  // Shared state
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  // Levels state
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [levels, setLevels] = useState<Level[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  // Spin prizes state
  const [spin, setSpin] = useState<SpinPrize[]>([]);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [createTierId, setCreateTierId] = useState<string>("");
  const [createPrizes, setCreatePrizes] = useState<SpinSlotRow[]>(defaultPrizes());

  // Fetch Tiers
  async function loadTiers() {
    setLoadingTiers(true);
    try {
      const data = await getVipTiersList(token());
      setTiers((data as any) || []);
      if (!selectedTier && (data as any)?.length) setSelectedTier(String((data as any)[0]._id));
    } catch (e: any) {
      toast({ title: "Failed to load tiers", description: e?.message, variant: "destructive" });
    } finally {
      setLoadingTiers(false);
    }
  }

  // Fetch Levels by parent
  async function loadLevels(parentId: string) {
    if (!parentId) return setLevels([]);
    setLoadingLevels(true);
    try {
      const data = await getVipLevelsByParent(parentId, token());
      setLevels((data as any) || []);
    } catch (e: any) {
      toast({ title: "Failed to load levels", description: e?.message, variant: "destructive" });
    } finally {
      setLoadingLevels(false);
    }
  }

  // Fetch Spin prizes
  async function loadSpinPrizes() {
    setLoadingSpin(true);
    try {
      const data = await listVipSpinPrizes(token());
      const rows = (Array.isArray(data) ? data : []) as SpinPrize[];
      setSpin(
        rows.map((s) => ({
          ...s,
          prizes: (s.prizes || []).map((p) => ({
            id: String(p.id ?? ""),
            amount: Number(p.amount ?? 0),
            probability: Number(p.probability ?? 0),
            label: typeof p.label === "string" ? p.label : "",
            minTurnover: typeof p.minTurnover === "number" ? p.minTurnover : 0,
            minVipXp: typeof p.minVipXp === "number" ? p.minVipXp : 0,
            minDepositCount:
              typeof p.minDepositCount === "number" ? p.minDepositCount : 0,
          })),
        }))
      );
    } catch (e: any) {
      toast({ title: "Failed to load spin prizes", description: e?.message, variant: "destructive" });
    } finally {
      setLoadingSpin(false);
    }
  }

  useEffect(() => { loadTiers(); }, []);
  useEffect(() => { if (selectedTier) loadLevels(selectedTier); }, [selectedTier]);
  useEffect(() => { loadSpinPrizes(); }, []);

  // ---------- Tier Create ----------
  async function createTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("icon") as File | null;
    const payload: any = {
      tiersName: String(fd.get("tiersName") || ""),
      order: Number(fd.get("order") || 0),
      levelUpBonus: Number(fd.get("levelUpBonus") || 0),
      weeklyCashback: Boolean(fd.get("weeklyCashback")),
      weeklyCashbackMin: Number(fd.get("weeklyCashbackMin") || 0),
      weeklyCashbackPercent: Number(fd.get("weeklyCashbackPercent") || 0),
      monthlyCashback: Boolean(fd.get("monthlyCashback")),
      monthlyCashbackMin: Number(fd.get("monthlyCashbackMin") || 0),
      monthlyCashbackPercent: Number(fd.get("monthlyCashbackPercent") || 0),
      noFeeWithdrawal: Boolean(fd.get("noFeeWithdrawal")),
      file: file && file.size > 0 ? file : undefined,
    };

    try {
      await createVipTiersApi(payload, token());
      toast({ title: "Tier created" });
      (e.currentTarget as HTMLFormElement).reset();
      await loadTiers();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message, variant: "destructive" });
    }
  }

  // ---------- Tier Update/Delete ----------
  async function updateTier(t: Tier, file?: File | null) {
    const payload: any = {
      tiersName: t.tiersName,
      order: t.order,
      levelUpBonus: t.levelUpBonus,
      weeklyCashback: Boolean(t.weeklyCashback),
      weeklyCashbackMin: t.weeklyCashbackMin,
      weeklyCashbackPercent: t.weeklyCashbackPercent,
      monthlyCashback: Boolean(t.monthlyCashback),
      monthlyCashbackMin: t.monthlyCashbackMin,
      monthlyCashbackPercent: t.monthlyCashbackPercent,
      noFeeWithdrawal: Boolean(t.noFeeWithdrawal),
      file: file && file.size > 0 ? file : undefined,
    };

    try {
      await updateVipTiersApi(t._id, payload, token());
      toast({ title: "Tier updated" });
      await loadTiers();
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    }
  }

  async function deleteTier(id: string) {
    if (!confirm("Delete this tier and its levels?")) return;
    try {
      await deleteVipTiersApi(id, token());
      toast({ title: "Tier deleted" });
      await loadTiers();
      if (id === selectedTier) setSelectedTier("");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  }

  // ---------- Level Create/Update/Delete ----------
  async function createLevel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createVipLevelApi({
        parentId: String(fd.get("parentId") || selectedTier),
        levelName: String(fd.get("levelName") || ""),
        xp: Number(fd.get("xp") || 0),
      }, token());
      toast({ title: "Level created" });
      (e.currentTarget as HTMLFormElement).reset();
      await loadLevels(String(fd.get("parentId") || selectedTier));
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message, variant: "destructive" });
    }
  }

  async function updateLevel(l: Level) {
    try {
      await updateVipLevelApi(l._id, { levelName: l.levelName, xp: l.xp }, token());
      toast({ title: "Level updated" });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    }
  }

  async function deleteLevel(l: Level) {
    if (!confirm("Delete this level?")) return;
    try {
      await deleteVipLevelApi(l._id, token());
      toast({ title: "Level deleted" });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  }

  // ---------- Spin Prize Create/Update/Delete ----------
  async function createSpin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tiersId = createTierId || tiers[0]?._id || "";
    if (!tiersId) { toast({ title: "Select a tier", variant: "destructive" }); return; }
    if (!Array.isArray(createPrizes) || createPrizes.length !== 16) {
      toast({ title: "Invalid prizes", description: "Must contain 16 items", variant: "destructive" });
      return;
    }
    const prizes = normalizeSpinSlots(createPrizes);
    try {
      await createVipSpinPrize({ tiersId, prizes }, token());
      toast({ title: "Prize set created" });
      setCreateTierId("");
      setCreatePrizes(defaultPrizes());
      await loadSpinPrizes();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message, variant: "destructive" });
    }
  }

  async function updateSpin(s: SpinPrize) {
    try {
      await updateVipSpinPrize(s._id, { prizes: normalizeSpinSlots(s.prizes), tiersId: s.tiersId }, token());
      toast({ title: "Prize set updated" });
      await loadSpinPrizes();
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    }
  }

  async function deleteSpin(id: string) {
    if (!confirm("Delete this prize set?")) return;
    try {
      await deleteVipSpinPrize(id, token());
      toast({ title: "Prize set deleted" });
      await loadSpinPrizes();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  }

  // ---------- UI ----------
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">VIP System</h1>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Tiers</CardTitle>
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-600">
                <Crown className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="tabular-nums text-2xl font-semibold">{tiers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Levels (selected tier)</CardTitle>
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-600">
                <Layers3 className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="tabular-nums text-2xl font-semibold">{levels.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Spin Prize Sets</CardTitle>
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-rose-500/15 text-rose-600">
                <Gift className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="tabular-nums text-2xl font-semibold">{spin.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tiers" className="mt-4">
          <TabsList>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="levels">Levels</TabsTrigger>
            <TabsTrigger value="spin">Spin Prizes</TabsTrigger>
          </TabsList>

          {/* Tiers */}
          <TabsContent value="tiers">
            <Card className="mt-3">
              <CardHeader><CardTitle className="text-base">Create Tier</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={createTier} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input name="tiersName" required />
                  </div>
                  <div>
                    <Label>Order</Label>
                    <Input type="number" name="order" required defaultValue={0} />
                  </div>
                  <div>
                    <Label>Level Up Bonus</Label>
                    <Input type="number" step="0.01" name="levelUpBonus" required defaultValue={0} />
                  </div>
                  <div>
                    <Label>Weekly Cashback</Label>
                    <div className="flex items-center gap-2"><Switch name="weeklyCashback" /><span className="text-xs text-muted-foreground">Enable</span></div>
                  </div>
                  <div>
                    <Label>Weekly Min</Label>
                    <Input type="number" step="0.01" name="weeklyCashbackMin" required defaultValue={0} />
                  </div>
                  <div>
                    <Label>Weekly %</Label>
                    <Input type="number" step="0.01" name="weeklyCashbackPercent" required defaultValue={0} />
                  </div>
                  <div>
                    <Label>Monthly Cashback</Label>
                    <div className="flex items-center gap-2"><Switch name="monthlyCashback" /><span className="text-xs text-muted-foreground">Enable</span></div>
                  </div>
                  <div>
                    <Label>Monthly Min</Label>
                    <Input type="number" step="0.01" name="monthlyCashbackMin" required defaultValue={0} />
                  </div>
                  <div>
                    <Label>Monthly %</Label>
                    <Input type="number" step="0.01" name="monthlyCashbackPercent" required defaultValue={0} />
                  </div>
                  <div>
                    <Label>No Fee Withdrawal</Label>
                    <div className="flex items-center gap-2"><Switch name="noFeeWithdrawal" /><span className="text-xs text-muted-foreground">Enable</span></div>
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Input type="file" name="icon" accept="image/*" />
                  </div>
                  <div className="md:col-span-3"><Button type="submit">Create</Button></div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-4 grid gap-3">
              {tiers.map((t) => (
                <Card key={t._id}>
                  <CardContent className="py-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <Input value={t.tiersName} onChange={(e) => setTiers((prev) => prev.map((x) => x._id===t._id?{...x, tiersName:e.target.value}:x))} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Order</div>
                      <Input type="number" value={t.order} onChange={(e) => setTiers((p)=>p.map((x)=>x._id===t._id?{...x, order:Number(e.target.value||0)}:x))} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Level Up Bonus</div>
                      <Input type="number" step="0.01" value={t.levelUpBonus} onChange={(e) => setTiers((p)=>p.map((x)=>x._id===t._id?{...x, levelUpBonus:Number(e.target.value||0)}:x))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Weekly</div>
                        <Switch checked={t.weeklyCashback} onCheckedChange={(v)=>setTiers((p)=>p.map((x)=>x._id===t._id?{...x, weeklyCashback:v}:x))} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Monthly</div>
                        <Switch checked={t.monthlyCashback} onCheckedChange={(v)=>setTiers((p)=>p.map((x)=>x._id===t._id?{...x, monthlyCashback:v}:x))} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">No Fee WD</div>
                        <Switch checked={t.noFeeWithdrawal} onCheckedChange={(v)=>setTiers((p)=>p.map((x)=>x._id===t._id?{...x, noFeeWithdrawal:v}:x))} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Upload Icon</div>
                      <Input type="file" accept="image/*" onChange={(e)=>updateTier(t, e.target.files?.[0]||null)} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={()=>updateTier(t)}>Save</Button>
                      <Button variant="outline" onClick={()=>{ setSelectedTier(t._id); }}>Levels</Button>
                      <Button variant="destructive" onClick={()=>deleteTier(t._id)}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tiers.length===0 && (
                <Card><CardContent className="py-6 text-sm text-muted-foreground">No tiers</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* Levels */}
          <TabsContent value="levels">
            <Card className="mt-3">
              <CardHeader><CardTitle className="text-base">Levels</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px]">
                    <Label>Tier</Label>
                    <Select value={selectedTier} onValueChange={(v)=>setSelectedTier(v)}>
                      <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                      <SelectContent>
                        {tiers.map((t)=> (
                          <SelectItem key={t._id} value={t._id}>{t.tiersName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <form onSubmit={createLevel} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="parentId" value={selectedTier} />
                    <div>
                      <Label>Name</Label>
                      <Input name="levelName" required />
                    </div>
                    <div>
                      <Label>XP</Label>
                      <Input name="xp" type="number" step="1" required />
                    </div>
                    <Button type="submit">Add</Button>
                  </form>
                </div>

                <div className="grid gap-3 mt-2">
                  {levels.map((l)=> (
                    <Card key={l._id}>
                      <CardContent className="py-4 flex items-center gap-3">
                        <Input className="w-56" value={l.levelName} onChange={(e)=>setLevels((p)=>p.map((x)=>x._id===l._id?{...x, levelName:e.target.value}:x))} />
                        <Input type="number" className="w-32" value={l.xp} onChange={(e)=>setLevels((p)=>p.map((x)=>x._id===l._id?{...x, xp:Number(e.target.value||0)}:x))} />
                        <div className="ml-auto flex gap-2">
                          <Button onClick={()=>updateLevel(l)}>Save</Button>
                          <Button variant="destructive" onClick={()=>deleteLevel(l)}>Delete</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {levels.length===0 && (
                    <Card><CardContent className="py-6 text-sm text-muted-foreground">No levels</CardContent></Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spin Prizes */}
          <TabsContent value="spin">
            <Card className="mt-3">
              <CardHeader><CardTitle className="text-base">Create Prize Set</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={createSpin} className="grid gap-4">
                  <div className="min-w-[220px]">
                    <Label>Tier</Label>
                    <Select value={createTierId} onValueChange={(v)=>setCreateTierId(v)}>
                      <SelectTrigger><SelectValue placeholder="Select a tier" /></SelectTrigger>
                      <SelectContent>
                        {tiers.map((t)=> (
                          <SelectItem key={t._id} value={t._id}>{t.tiersName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Prizes — 16 ô</div>
                    <p className="text-xs text-muted-foreground max-w-3xl">
                      <strong>Xác suất</strong>: trọng số tương đối trong số các ô đủ điều kiện (tổng không cần = 1).{" "}
                      <strong>Điều kiện</strong>: để trống hoặc 0 = không giới hạn; nếu nhập (&gt;0), user phải thỏa tất cả điều kiện đã set thì ô mới được đưa vào pool quay (min turnover · min VIP XP · min số lần nạp).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {createPrizes.map((p, i) => (
                        <div key={i} className="rounded-md border p-3 grid gap-2 text-sm">
                          <div className="text-xs font-medium text-muted-foreground">Ô {i+1}</div>
                          <Input placeholder="id (chuỗi)" value={p.id} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,id:e.target.value}:x))} />
                          <Input placeholder="Nhãn hiển thị (tuỳ chọn)" value={p.label} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,label:e.target.value}:x))} />
                          <Input type="number" placeholder="Thưởng (amount)" value={p.amount} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,amount:Number(e.target.value)||0}:x))} />
                          <Input type="number" step="0.0001" placeholder="Trọng số xác suất" value={p.probability} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,probability:Number(e.target.value)||0}:x))} />
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-[10px] text-muted-foreground">Min TO</div>
                              <Input type="number" className="h-8 text-xs" placeholder="0" value={p.minTurnover || ""} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,minTurnover:Number(e.target.value)||0}:x))} />
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Min XP</div>
                              <Input type="number" className="h-8 text-xs" placeholder="0" value={p.minVipXp || ""} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,minVipXp:Number(e.target.value)||0}:x))} />
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Min nạp</div>
                              <Input type="number" className="h-8 text-xs" placeholder="0" value={p.minDepositCount || ""} onChange={(e)=>setCreatePrizes(prev=>prev.map((x,idx)=>idx===i?{...x,minDepositCount:Number(e.target.value)||0}:x))} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">Tổng trọng số (tham khảo): {createPrizes.reduce((s,x)=>s+Number(x.probability||0),0).toFixed(4)}</div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={()=>setCreatePrizes(defaultPrizes())}>Reset</Button>
                      <Button type="submit">Create</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-4 grid gap-3">
              {spin.map((s) => (
                <Card key={s._id}>
                  <CardContent className="py-4 grid gap-3">
                    <div className="text-sm font-medium">Tier: {tiers.find(t=>t._id===s.tiersId)?.tiersName || s.tiersId}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {(s.prizes||[]).map((p, i) => (
                        <div key={i} className="rounded-md border p-3 grid gap-2 text-sm">
                          <div className="text-xs font-medium text-muted-foreground">Ô {i+1}</div>
                          <Input value={p.id} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,id:e.target.value}:pp)}:x))} />
                          <Input placeholder="Nhãn" value={p.label} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,label:e.target.value}:pp)}:x))} />
                          <Input type="number" value={p.amount} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,amount:Number(e.target.value)||0}:pp)}:x))} />
                          <Input type="number" step="0.0001" value={p.probability} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,probability:Number(e.target.value)||0}:pp)}:x))} />
                          <div className="grid grid-cols-3 gap-2">
                            <Input type="number" className="h-8 text-xs" title="Min turnover" placeholder="Min TO" value={p.minTurnover || ""} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,minTurnover:Number(e.target.value)||0}:pp)}:x))} />
                            <Input type="number" className="h-8 text-xs" title="Min VIP XP" placeholder="Min XP" value={p.minVipXp || ""} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,minVipXp:Number(e.target.value)||0}:pp)}:x))} />
                            <Input type="number" className="h-8 text-xs" title="Min số lần nạp" placeholder="Nạp" value={p.minDepositCount || ""} onChange={(e)=>setSpin(prev=>prev.map(x=>x._id===s._id?{...x,prizes:x.prizes.map((pp,idx)=>idx===i?{...pp,minDepositCount:Number(e.target.value)||0}:pp)}:x))} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">Tổng trọng số (tham khảo): {(s.prizes||[]).reduce((sum,pp)=>sum+Number(pp.probability||0),0).toFixed(4)}</div>
                    <div className="flex gap-2">
                      <Button onClick={()=>updateSpin(s)}>Save</Button>
                      <Button variant="destructive" onClick={()=>deleteSpin(s._id)}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {spin.length===0 && (
                <Card><CardContent className="py-6 text-sm text-muted-foreground">No prize sets</CardContent></Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
