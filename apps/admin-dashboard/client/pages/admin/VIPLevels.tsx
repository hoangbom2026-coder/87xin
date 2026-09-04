import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminRelatedLinks from "@/components/admin/AdminRelatedLinks";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@game/ui/select";
import { toast } from "@game/ui/use-toast";
import { useEffect, useMemo, useState } from "react";
import {
  getVipTiersList,
  getVipLevelsByParent,
  createVipLevelApi,
  updateVipLevelApi,
  deleteVipLevelApi,
  VipTiers,
  VipLevel,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

export default function VIPLevels() {
  const [tiers, setTiers] = useState<VipTiers[]>([]);
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const token = useMemo(() => getAdminToken() || "", []);

  async function loadTiers() {
    setLoading(true);
    try {
      const data = await getVipTiersList(token);
      setTiers(data || []);
      if (!selectedTier && data?.length) setSelectedTier(String(data[0]._id));
    } catch (e: any) {
      toast({ title: "Tải bậc VIP thất bại", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadLevels(tierId: string) {
    if (!tierId) return setLevels([]);
    setLoading(true);
    try {
      const data = await getVipLevelsByParent(tierId, token);
      setLevels(data || []);
    } catch (e: any) {
      toast({ title: "Tải cấp VIP thất bại", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTiers(); }, []);
  useEffect(() => { if (selectedTier) loadLevels(selectedTier); }, [selectedTier]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parentId = String(fd.get("parentId") || selectedTier);
    const levelName = String(fd.get("levelName") || "");
    const xp = Number(fd.get("xp") || 0);
    if (!parentId) { toast({ title: "Vui lòng chọn bậc VIP", variant: "destructive" }); return; }
    try {
      await createVipLevelApi({ parentId, levelName, xp }, token);
      toast({ title: "Đã tạo cấp VIP" });
      (e.currentTarget as HTMLFormElement).reset();
      await loadLevels(parentId);
    } catch (e: any) {
      toast({ title: "Tạo thất bại", description: e?.message, variant: "destructive" });
    }
  }

  async function onSave(l: VipLevel) {
    try {
      await updateVipLevelApi(l._id, { levelName: l.levelName, xp: l.xp }, token);
      toast({ title: "Đã cập nhật cấp VIP" });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: "Cập nhật thất bại", description: e?.message, variant: "destructive" });
    }
  }

  async function onDelete(l: VipLevel) {
    if (!confirm("Xoá cấp này?")) return;
    try {
      await deleteVipLevelApi(l._id, token);
      toast({ title: "Đã xoá cấp VIP" });
      await loadLevels(l.parentId);
    } catch (e: any) {
      toast({ title: "Xoá thất bại", description: e?.message, variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="space-y-6">
        <AdminPageHeader
          title="Cấp VIP (theo bậc trong collection)"
          description={
            "Quản lý tên cấp và XP theo từng bậc VIP (Mongo). Khác với trang Chương trình VIP: " +
            "ở đó cấu hình đặc quyền vận hành (hạn mức rút, phí, referral, vòng quay) theo cấp 0–8 cho trang công khai."
          }
          actions={
            <Button
              variant="outline"
              onClick={() => {
                loadTiers();
                if (selectedTier) loadLevels(selectedTier);
              }}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </Button>
          }
        />

        <Card>
          <CardHeader><CardTitle className="text-base">Tạo cấp</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3 w-full">
              <div className="w-full sm:min-w-[220px]">
                <Label>Bậc</Label>
                <Select value={selectedTier} onValueChange={(v)=>setSelectedTier(v)}>
                  <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Chọn bậc" /></SelectTrigger>
                  <SelectContent>
                    {tiers.map((t)=> (
                      <SelectItem key={t._id} value={t._id}>{t.tiersName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="parentId" value={selectedTier} />
              </div>
              <div className="w-full sm:w-auto">
                <Label>Tên</Label>
                <Input name="levelName" required className="w-full" />
              </div>
              <div className="w-full sm:w-auto">
                <Label>XP</Label>
                <Input name="xp" type="number" step="1" required className="w-full" />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Thêm</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Danh sách cấp</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {levels.map((l) => (
              <div key={l._id} className="flex flex-wrap items-center gap-3">
                <Input className="w-full sm:w-56" value={l.levelName} onChange={(e)=>setLevels((p)=>p.map((x)=>x._id===l._id?{...x, levelName:e.target.value}:x))} />
                <Input type="number" className="w-full sm:w-32" value={l.xp} onChange={(e)=>setLevels((p)=>p.map((x)=>x._id===l._id?{...x, xp:Number(e.target.value||0)}:x))} />
                <div className="ml-0 sm:ml-auto flex flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Button onClick={()=>onSave(l)}>Lưu</Button>
                  <Button variant="destructive" onClick={()=>onDelete(l)}>Xoá</Button>
                </div>
              </div>
            ))}
            {levels.length===0 && (
              <div className="py-6 text-sm text-muted-foreground">Không có cấp nào</div>
            )}
          </CardContent>
        </Card>

        <AdminRelatedLinks
          links={[
            {
              to: "/vip-program",
              label: "Chương trình VIP (0–8, đặc quyền site)",
              hint: "Cấu hình hiển thị công khai & vận hành",
            },
            {
              to: "/setting/site",
              label: "Cài đặt site (bootstrap)",
            },
            {
              to: "/admin/theme",
              label: "Theme màu web & admin",
            },
          ]}
        />
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
