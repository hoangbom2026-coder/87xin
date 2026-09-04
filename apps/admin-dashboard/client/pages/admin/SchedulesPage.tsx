import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { useEffect, useMemo, useState } from "react";

export default function SchedulesPage() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accrualCron, setAccrualCron] = useState("*/30 * * * *");
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoCron, setAutoCron] = useState("0 0 * * *");
  const [autoMinThreshold, setAutoMinThreshold] = useState(100);

  async function load() {
    setLoading(true);
    try {
      const s = await getBusinessSettings(token);
      const af = s?.affiliateProgram || {};
      setAccrualCron(String(af?.accrualCron || "*/30 * * * *"));
      setAutoEnabled(Boolean(af?.autoPayout?.enabled));
      setAutoCron(String(af?.autoPayout?.cron || "0 0 * * *"));
      setAutoMinThreshold(Number(af?.autoPayout?.minThreshold || 100));
    } catch (e: any) {
      toast({ title: "Tải lịch thất bại", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await patchBusinessSettings(
        {
          affiliateProgram: {
            accrualCron,
            autoPayout: {
              enabled: autoEnabled,
              cron: autoCron,
              minThreshold: Number(autoMinThreshold || 0),
            },
          },
        },
        token,
      );
      toast({ title: "Đã lưu lịch trình" });
      await load();
    } catch (e: any) {
      toast({ title: "Lưu thất bại", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">Lịch trình hệ thống</h1>
            <p className="text-sm text-muted-foreground">
              Điều khiển cron hoa hồng & auto payout trong settings (backend restart cron tự động).
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Đang tải..." : "Làm mới"}</Button>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Affiliate accrual</CardTitle>
            <CardDescription>Ví dụ: <code className="rounded bg-muted px-1 text-xs">*/30 * * * *</code> = mỗi 30 phút.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Cron tổng hợp hoa hồng</Label>
            <Input value={accrualCron} onChange={(e) => setAccrualCron(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Auto payout</CardTitle>
            <CardDescription>Chạy job chi trả tự động cho affiliate khi đủ ngưỡng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
              <span className="text-sm">Bật auto payout</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Cron auto payout</Label>
                <Input value={autoCron} onChange={(e) => setAutoCron(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ngưỡng tối thiểu</Label>
                <Input type="number" value={autoMinThreshold} onChange={(e) => setAutoMinThreshold(Number(e.target.value || 0))} />
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu cấu hình lịch"}</Button>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
