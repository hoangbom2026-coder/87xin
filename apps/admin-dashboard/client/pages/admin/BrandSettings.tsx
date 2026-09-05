import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@game/ui/use-toast";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import AdminLayout from "@/components/layout/AdminLayout";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";

export default function BrandSettings() {
  const { toast } = useToast();
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await getBusinessSettings();
      setSiteName(String(settings?.siteName || ""));
    } catch (error) {
      toast({ title: "Không thể tải cấu hình thương hiệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    const nextName = siteName.trim();
    if (!nextName) {
      toast({ title: "Tên thương hiệu không được để trống", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await patchBusinessSettings({ siteName: nextName });
      setSiteName(nextName);
      toast({ title: "Đã lưu tên thương hiệu" });
    } catch (error) {
      toast({ title: "Không thể lưu tên thương hiệu", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thương hiệu</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tên này được dùng trên giao diện người chơi và nội dung có hỗ trợ thương hiệu động.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tên thương hiệu hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground" htmlFor="site-name">
                      Tên thương hiệu
                    </label>
                    <Input
                      id="site-name"
                      value={siteName}
                      onChange={(event) => setSiteName(event.target.value)}
                      placeholder="Ví dụ: Brand A"
                      maxLength={80}
                    />
                  </div>
                  <Button onClick={() => void saveSettings()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu thương hiệu
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
