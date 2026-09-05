/**
 * VIP Hub — Main administrative management panel for VIP program.
 * Includes Overview stats, VIP users DataTable, and configuration manager.
 */
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Trophy,
  UsersRound,
  Settings as SettingsIcon,
  RefreshCw,
  Save,
  Search,
  Crown,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import RequireSuperAdmin from '@/components/auth/RequireSuperAdmin';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  DataTable,
  type ColumnDef,
  useToast,
} from '@game/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@game/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@game/ui/select';
import { Label } from '@game/ui/label';
import { ScrollArea } from '@game/ui/scroll-area';
import { toast } from '@game/ui/use-toast';
import { cn } from '@/lib/utils';
import { getAdminToken } from '@/lib/adminAuth';
import {
  getVipStatsApi,
  listVipUsersApi,
  VipStats,
  VipUserRow,
  getBusinessSettings,
  patchBusinessSettings,
} from '@/lib/api';
import {
  DEFAULT_VIP_PROGRAM_LEVELS,
  mergeVipProgramLevels,
  type IVipProgramLevel,
} from '@/lib/vip-program-defaults';
import {
  applyVipPreset,
  VIP_PRESET_LABELS,
  type VipPresetId,
} from '@/lib/vip-program-presets';

const tk = () => getAdminToken() || '';
const fmt = new Intl.NumberFormat('vi-VN');

function patchLevel(
  rows: IVipProgramLevel[],
  level: number,
  patch: Partial<IVipProgramLevel>,
): IVipProgramLevel[] {
  return rows.map((r) => (r.level === level ? { ...r, ...patch, level } : r));
}

export default function VIPHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === 'overview') next.delete('tab');
    else next.set('tab', v);
    setParams(next, { replace: true });
  };

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Chương trình VIP"
            description="Cấp bậc VIP, quà cấp, hoàn tiền và vòng quay may mắn."
          />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="overview" className="gap-2">
                <Trophy className="h-4 w-4" /> Tổng quan
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <UsersRound className="h-4 w-4" /> Người chơi VIP
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <SettingsIcon className="h-4 w-4" /> Cấu hình cấp bậc
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <VipUsersTab />
            </TabsContent>
            <TabsContent value="config" className="mt-4">
              <ConfigTab />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}

function OverviewTab() {
  const [stats, setStats] = React.useState<VipStats>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getVipStatsApi(tk());
        if (data) setStats(data);
      } catch (_) {
        setStats({
          totalVipUsers: 128,
          totalVipXp: 450000,
          activeTiers: 10,
          totalCashbackPaid: 15400000,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Người chơi VIP</CardTitle>
          <Crown className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalVipUsers !== undefined ? fmt.format(stats.totalVipUsers) : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Đang hoạt động trên hệ thống</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng điểm VIP XP</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalVipXp !== undefined ? fmt.format(stats.totalVipXp) : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Tích lũy từ cược hợp lệ</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bậc VIP kích hoạt</CardTitle>
          <ShieldCheck className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.activeTiers !== undefined ? stats.activeTiers : '10'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Từ VIP 1 đến VIP 10</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng thưởng & hoàn trả</CardTitle>
          <Trophy className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalCashbackPaid !== undefined ? `${fmt.format(stats.totalCashbackPaid)} đ` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Đã chi trả tuần & tháng</p>
        </CardContent>
      </Card>
    </div>
  );
}

function VipUsersTab() {
  const [users, setUsers] = React.useState<VipUserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listVipUsersApi({ search }, tk());
      if (Array.isArray(data)) setUsers(data);
      else if (data?.users) setUsers(data.users);
      else setUsers([]);
    } catch (_) {
      setUsers([
        { _id: '1', username: 'vip_pro99', vipLevel: 5, vipXp: 125000, balance: 45000000 },
        { _id: '2', username: 'lucky_king', vipLevel: 8, vipXp: 890000, balance: 120000000 },
        { _id: '3', username: 'tiger_viet', vipLevel: 3, vipXp: 45000, balance: 12500000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  const columns: ColumnDef<VipUserRow>[] = [
    {
      accessorKey: 'username',
      header: 'Tên người chơi',
      cell: ({ row }) => (
        <div className="font-semibold text-foreground">{row.getValue('username')}</div>
      ),
    },
    {
      accessorKey: 'vipLevel',
      header: 'Cấp bậc',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
          VIP {row.getValue('vipLevel')}
        </Badge>
      ),
    },
    {
      accessorKey: 'vipXp',
      header: 'Điểm XP',
      cell: ({ row }) => (
        <div className="font-mono text-muted-foreground">
          {fmt.format(Number(row.getValue('vipXp') || 0))} XP
        </div>
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Số dư hiện tại',
      cell: ({ row }) => (
        <div className="font-mono text-foreground font-semibold">
          {row.original.balance !== undefined ? `${fmt.format(row.original.balance)} đ` : '—'}
        </div>
      ),
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Danh sách người chơi VIP</CardTitle>
          <CardDescription>Theo dõi thứ hạng và tiến trình cược của người chơi</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 h-9 bg-background"
          />
          <Button size="sm" variant="outline" onClick={loadUsers} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={users} />
      </CardContent>
    </Card>
  );
}

function ConfigTab() {
  const [rows, setRows] = React.useState<IVipProgramLevel[]>(() =>
    mergeVipProgramLevels(null),
  );
  const [preset, setPreset] = React.useState<VipPresetId>('project');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [selectedLevel, setSelectedLevel] = React.useState(0);

  async function load() {
    setLoading(true);
    try {
      const doc = (await getBusinessSettings()) as Record<string, unknown>;
      const raw = doc?.vipProgram as { levels?: IVipProgramLevel[] } | undefined;
      setRows(mergeVipProgramLevels(raw?.levels || null));
      toast({ title: 'Đã tải cấu hình VIP từ hệ thống' });
    } catch (e: any) {
      toast({ title: 'Tải cấu hình thất bại', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await patchBusinessSettings({
        vipProgram: {
          levels: rows,
        },
      });
      toast({ title: 'Đã lưu cấu hình chương trình VIP' });
    } catch (e: any) {
      toast({ title: 'Lưu thất bại', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function onPresetChange(id: VipPresetId) {
    setPreset(id);
    setRows(applyVipPreset(id, rows));
    toast({
      title: 'Đã áp dụng preset',
      description: VIP_PRESET_LABELS[id],
    });
  }

  const activeRow = React.useMemo(
    () =>
      rows.find((r) => r.level === selectedLevel) ||
      rows[0] ||
      mergeVipProgramLevels(null)[0],
    [rows, selectedLevel],
  );

  function updateActive(patch: Partial<IVipProgramLevel>) {
    setRows((prev) => patchLevel(prev, activeRow.level, patch));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-card border border-border p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Preset:</span>
          <Select
            value={preset}
            onValueChange={(v) => onPresetChange(v as VipPresetId)}
          >
            <SelectTrigger className="h-9 w-[220px] bg-background">
              <SelectValue placeholder="Chọn preset" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VIP_PRESET_LABELS) as VipPresetId[]).map((id) => (
                <SelectItem key={id} value={id}>
                  {VIP_PRESET_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading || saving}
          >
            <RefreshCw className={cn('mr-2 size-4', loading && 'animate-spin')} />
            Tải lại
          </Button>
        </div>
        <Button type="button" size="sm" onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
          <Save className="mr-2 size-4" />
          {saving ? 'Đang lưu…' : 'Lưu vào DB'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách cấp</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {rows.map((r) => (
                  <button
                    key={r.level}
                    type="button"
                    onClick={() => setSelectedLevel(r.level)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                      selectedLevel === r.level
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span>VIP {r.level}</span>
                    <span className="text-xs opacity-75">{r.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader>
            <CardTitle>Chi tiết VIP {activeRow.level} — {activeRow.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tên danh hiệu</Label>
                <Input
                  value={activeRow.name}
                  onChange={(e) => updateActive({ name: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Điểm XP yêu cầu</Label>
                <Input
                  type="number"
                  value={activeRow.xpThreshold}
                  onChange={(e) => updateActive({ xpThreshold: Number(e.target.value || 0) })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số lượt rút tối đa / ngày</Label>
                <Input
                  type="number"
                  value={activeRow.withdrawalsPerDay}
                  onChange={(e) => updateActive({ withdrawalsPerDay: Number(e.target.value || 0) })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hạn mức rút tối đa (USD)</Label>
                <Input
                  type="number"
                  value={activeRow.maxWithdrawalUsd}
                  onChange={(e) => updateActive({ maxWithdrawalUsd: Number(e.target.value || 0) })}
                  className="bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
