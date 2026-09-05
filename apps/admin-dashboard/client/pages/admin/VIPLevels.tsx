/**
 * VIP Levels management page.
 * Manages VIP levels and required XP per Tier with standardized DataTable and AdminLayout.
 */
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, Plus, RefreshCw } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@game/ui/select';
import { toast } from '@game/ui/use-toast';
import {
  getVipTiersList,
  getVipLevelsByParent,
  createVipLevelApi,
  updateVipLevelApi,
  deleteVipLevelApi,
  VipTiers,
  VipLevel,
} from '@/lib/api';
import { getAdminToken } from '@/lib/adminAuth';

export default function VIPLevels() {
  const [tiers, setTiers] = useState<VipTiers[]>([]);
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const token = useMemo(() => getAdminToken() || '', []);

  async function loadTiers() {
    setLoading(true);
    try {
      const data = await getVipTiersList(token);
      setTiers((data as any) || []);
      if (!selectedTier && (data as any)?.length) {
        setSelectedTier(String((data as any)[0]._id));
      }
    } catch (e: any) {
      toast({ title: 'Tải bậc VIP thất bại', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function loadLevels(tierId: string) {
    if (!tierId) return setLevels([]);
    setLoading(true);
    try {
      const data = await getVipLevelsByParent(tierId, token);
      setLevels((data as any) || []);
    } catch (e: any) {
      toast({ title: 'Tải cấp VIP thất bại', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTiers();
  }, []);

  useEffect(() => {
    if (selectedTier) loadLevels(selectedTier);
  }, [selectedTier]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parentId = String(form.get('parentId') || selectedTier || '');
    const levelName = String(form.get('levelName') || '');
    const xp = Number(form.get('xp') || 0);

    if (!parentId) {
      toast({ title: 'Chưa chọn bậc VIP', variant: 'destructive' });
      return;
    }
    try {
      await createVipLevelApi({ parentId, levelName, xp }, token);
      toast({ title: 'Đã thêm cấp VIP mới' });
      (e.target as HTMLFormElement).reset();
      await loadLevels(parentId);
    } catch (e: any) {
      toast({ title: 'Tạo cấp thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  async function onSave(l: VipLevel) {
    try {
      await updateVipLevelApi(l._id, { levelName: l.levelName, xp: l.xp }, token);
      toast({ title: 'Đã cập nhật cấp VIP' });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: 'Cập nhật thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  async function onDelete(l: VipLevel) {
    if (!confirm('Xoá cấp này?')) return;
    try {
      await deleteVipLevelApi(l._id, token);
      toast({ title: 'Đã xoá cấp VIP' });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: 'Xoá thất bại', description: e?.message, variant: 'destructive' });
    }
  }

  const columns: ColumnDef<VipLevel>[] = [
    {
      accessorKey: 'levelName',
      header: 'Tên cấp độ',
      cell: ({ row }) => (
        <Input
          className="w-48 bg-background"
          value={row.original.levelName}
          onChange={(e) =>
            setLevels((prev) =>
              prev.map((x) =>
                x._id === row.original._id ? { ...x, levelName: e.target.value } : x
              )
            )
          }
        />
      ),
    },
    {
      accessorKey: 'xp',
      header: 'Điểm XP yêu cầu',
      cell: ({ row }) => (
        <Input
          type="number"
          className="w-36 bg-background font-mono"
          value={row.original.xp}
          onChange={(e) =>
            setLevels((prev) =>
              prev.map((x) =>
                x._id === row.original._id ? { ...x, xp: Number(e.target.value || 0) } : x
              )
            )
          }
        />
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onSave(row.original)}>
            <Save className="h-4 w-4 mr-1" /> Lưu
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Cấp VIP (Theo Bậc)"
            description="Quản lý tên cấp và điểm XP tích lũy tương ứng theo từng bậc VIP."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadTiers();
                  if (selectedTier) loadLevels(selectedTier);
                }}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
              </Button>
            }
          />

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Thêm cấp độ mới</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3 w-full">
                <div className="w-full sm:min-w-[220px]">
                  <Label>Bậc VIP</Label>
                  <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v)}>
                    <SelectTrigger className="h-9 w-full bg-background">
                      <SelectValue placeholder="Chọn bậc..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.tiersName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="parentId" value={selectedTier} />
                </div>
                <div className="w-full sm:w-auto">
                  <Label>Tên cấp độ</Label>
                  <Input name="levelName" required placeholder="VD: Cấp 1" className="w-full bg-background" />
                </div>
                <div className="w-full sm:w-auto">
                  <Label>Điểm XP</Label>
                  <Input name="xp" type="number" step="1" required defaultValue={1000} className="w-full bg-background" />
                </div>
                <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Thêm Cấp
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Danh sách cấp độ</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={levels} />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
