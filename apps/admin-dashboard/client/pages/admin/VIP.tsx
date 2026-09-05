/**
 * VIP Management page for Admin Dashboard.
 * Manages VIP Tiers, VIP Levels, and Spin Prizes with standardized DataTable and AdminLayout.
 */
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Crown, Layers3, Gift, Trash2, Save, Plus } from 'lucide-react';

import RequireSuperAdmin from '@/components/auth/RequireSuperAdmin';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  DataTable,
  type ColumnDef,
} from '@game/ui';
import { Badge } from '@game/ui/badge';
import { Switch } from '@game/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@game/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@game/ui/select';
import { toast } from '@game/ui/use-toast';
import {
  getVipTiersList,
  getVipLevelsByParent,
  createVipTiersApi,
  updateVipTiersApi,
  deleteVipTiersApi,
  createVipLevelApi,
  updateVipLevelApi,
  deleteVipLevelApi,
  listVipSpinPrizes,
  createVipSpinPrize,
  updateVipSpinPrize,
  deleteVipSpinPrize,
} from '@/lib/api';
import { getAdminToken } from '@/lib/adminAuth';

const token = () => getAdminToken() || '';

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
    label: '',
    minTurnover: 0,
    minVipXp: 0,
    minDepositCount: 0,
  }));
}

function normalizeSpinSlots(rows: SpinSlotRow[]) {
  return rows.map((p) => ({
    id: String(p.id || ''),
    amount: Number(p.amount || 0),
    probability: Number(p.probability || 0),
    ...(String(p.label || '').trim() ? { label: String(p.label).trim() } : {}),
    ...(Number(p.minTurnover) > 0 ? { minTurnover: Number(p.minTurnover) } : {}),
    ...(Number(p.minVipXp) > 0 ? { minVipXp: Number(p.minVipXp) } : {}),
    ...(Number(p.minDepositCount) > 0
      ? { minDepositCount: Math.floor(Number(p.minDepositCount)) }
      : {}),
  }));
}

export default function VIP() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  const [selectedTier, setSelectedTier] = useState<string>('');
  const [levels, setLevels] = useState<Level[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  const [spin, setSpin] = useState<SpinPrize[]>([]);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [createTierId, setCreateTierId] = useState<string>('');
  const [createPrizes, setCreatePrizes] = useState<SpinSlotRow[]>(defaultPrizes());

  async function loadTiers() {
    setLoadingTiers(true);
    try {
      const data = await getVipTiersList(token());
      setTiers((data as any) || []);
      if (!selectedTier && (data as any)?.length) setSelectedTier(String((data as any)[0]._id));
    } catch (e: any) {
      toast({ title: 'Không thể tải danh sách bậc VIP', description: e?.message, variant: 'destructive' });
    } finally {
      setLoadingTiers(false);
    }
  }

  async function loadLevels(parentId: string) {
    if (!parentId) return setLevels([]);
    setLoadingLevels(true);
    try {
      const data = await getVipLevelsByParent(parentId, token());
      setLevels((data as any) || []);
    } catch (e: any) {
      toast({ title: 'Không thể tải danh sách cấp VIP', description: e?.message, variant: 'destructive' });
    } finally {
      setLoadingLevels(false);
    }
  }

  async function loadSpinPrizes() {
    setLoadingSpin(true);
    try {
      const data = await listVipSpinPrizes(token());
      const rows = (Array.isArray(data) ? data : []) as SpinPrize[];
      setSpin(
        rows.map((s) => ({
          ...s,
          prizes: (s.prizes || []).map((p) => ({
            id: String(p.id ?? ''),
            amount: Number(p.amount ?? 0),
            probability: Number(p.probability ?? 0),
            label: typeof p.label === 'string' ? p.label : '',
            minTurnover: typeof p.minTurnover === 'number' ? p.minTurnover : 0,
            minVipXp: typeof p.minVipXp === 'number' ? p.minVipXp : 0,
            minDepositCount:
              typeof p.minDepositCount === 'number' ? p.minDepositCount : 0,
          })),
        }))
      );
    } catch (e: any) {
      toast({ title: 'Không thể tải giải thưởng vòng quay', description: e?.message, variant: 'destructive' });
    } finally {
      setLoadingSpin(false);
    }
  }

  useEffect(() => {
    loadTiers();
    loadSpinPrizes();
  }, []);

  useEffect(() => {
    if (selectedTier) loadLevels(selectedTier);
  }, [selectedTier]);

  async function createTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createVipTiersApi(form, token());
      toast({ title: 'Đã tạo bậc VIP mới' });
      (e.target as HTMLFormElement).reset();
      await loadTiers();
    } catch (e: any) {
      toast({ title: 'Tạo bậc thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  async function updateTier(t: Tier) {
    try {
      const body = {
        tiersName: t.tiersName,
        order: t.order,
        levelUpBonus: t.levelUpBonus,
        weeklyCashback: t.weeklyCashback,
        weeklyCashbackMin: t.weeklyCashbackMin,
        weeklyCashbackPercent: t.weeklyCashbackPercent,
        monthlyCashback: t.monthlyCashback,
        monthlyCashbackMin: t.monthlyCashbackMin,
        monthlyCashbackPercent: t.monthlyCashbackPercent,
        noFeeWithdrawal: t.noFeeWithdrawal,
      };
      await updateVipTiersApi(t._id, body, token());
      toast({ title: 'Đã cập nhật bậc VIP' });
      await loadTiers();
    } catch (e: any) {
      toast({ title: 'Cập nhật thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  async function deleteTier(id: string) {
    if (!confirm('Xóa bậc VIP này?')) return;
    try {
      await deleteVipTiersApi(id, token());
      toast({ title: 'Đã xóa bậc VIP' });
      await loadTiers();
    } catch (e: any) {
      toast({ title: 'Xóa thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  async function createLevel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parentId = String(form.get('parentId') || selectedTier || '');
    const levelName = String(form.get('levelName') || '');
    const xp = Number(form.get('xp') || 0);
    if (!parentId) {
      toast({ title: 'Vui lòng chọn bậc VIP', variant: 'destructive' });
      return;
    }
    try {
      await createVipLevelApi({ parentId, levelName, xp }, token());
      toast({ title: 'Đã tạo cấp VIP' });
      (e.target as HTMLFormElement).reset();
      await loadLevels(parentId);
    } catch (e: any) {
      toast({ title: 'Tạo cấp thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  async function deleteLevel(l: Level) {
    if (!confirm('Xóa cấp độ này?')) return;
    try {
      await deleteVipLevelApi(l._id, token());
      toast({ title: 'Đã xóa cấp độ' });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: 'Xóa thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  const levelColumns: ColumnDef<Level>[] = [
    {
      accessorKey: 'levelName',
      header: 'Tên cấp độ',
      cell: ({ row }) => (
        <div className="font-semibold text-foreground">{row.getValue('levelName')}</div>
      ),
    },
    {
      accessorKey: 'xp',
      header: 'Điểm XP yêu cầu',
      cell: ({ row }) => (
        <div className="font-mono text-muted-foreground">{Number(row.getValue('xp')).toLocaleString()} XP</div>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => deleteLevel(row.original)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Quản lý hệ thống VIP"
            description="Cấu hình bậc VIP, các cấp độ phụ thuộc và phần thưởng vòng quay."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tổng số Bậc VIP</CardTitle>
                <Crown className="size-5 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{tiers.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Cấp độ (bậc đã chọn)</CardTitle>
                <Layers3 className="size-5 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{levels.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Bộ giải thưởng vòng quay</CardTitle>
                <Gift className="size-5 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{spin.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tiers" className="w-full">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="tiers">Bậc VIP (Tiers)</TabsTrigger>
              <TabsTrigger value="levels">Cấp độ (Levels)</TabsTrigger>
              <TabsTrigger value="spins">Vòng quay (Spin Prizes)</TabsTrigger>
            </TabsList>

            <TabsContent value="tiers" className="mt-4 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Thêm Bậc VIP mới</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createTier} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Tên Bậc</Label>
                      <Input name="tiersName" required placeholder="VD: VIP Gold" className="bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label>Thứ tự sắp xếp</Label>
                      <Input type="number" name="order" required defaultValue={1} className="bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label>Thưởng lên cấp (VND)</Label>
                      <Input type="number" step="0.01" name="levelUpBonus" required defaultValue={0} className="bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label>Hoàn tiền tuần (%)</Label>
                      <Input type="number" step="0.01" name="weeklyCashbackPercent" required defaultValue={0} className="bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label>Hoàn tiền tháng (%)</Label>
                      <Input type="number" step="0.01" name="monthlyCashbackPercent" required defaultValue={0} className="bg-background" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full bg-primary text-primary-foreground">
                        <Plus className="h-4 w-4 mr-1" /> Thêm Bậc VIP
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-3">
                {tiers.map((t) => (
                  <Card key={t._id} className="bg-card border-border p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                          Thứ tự {t.order}
                        </Badge>
                        <span className="font-bold text-foreground text-lg">{t.tiersName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateTier(t)}>
                          <Save className="h-4 w-4 mr-1" /> Lưu
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteTier(t._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="levels" className="mt-4 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Thêm Cấp độ phụ thuộc</CardTitle>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="w-[200px] bg-background">
                      <SelectValue placeholder="Chọn bậc VIP..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((t) => (
                        <SelectItem key={t._id} value={t._id}>{t.tiersName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createLevel} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Tên Cấp độ</Label>
                      <Input name="levelName" required placeholder="VD: Cấp 1" className="bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label>Điểm XP yêu cầu</Label>
                      <Input type="number" name="xp" required defaultValue={1000} className="bg-background" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full bg-primary text-primary-foreground">
                        <Plus className="h-4 w-4 mr-1" /> Thêm Cấp độ
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <DataTable columns={levelColumns} data={levels} />
            </TabsContent>

            <TabsContent value="spins" className="mt-4 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Cấu hình giải thưởng vòng quay may mắn (16 ô)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Đã cấu hình {spin.length} bộ giải thưởng cho các bậc VIP.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
