import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { useToast } from "@game/ui/use-toast";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Switch } from "@game/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Badge } from "@game/ui/badge";
import { Loader2, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@game/ui/tabs";
import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";

interface DepositMethod {
  id: string;
  name: string;
  icon: string;
  status: "active" | "maintenance";
}

interface VietnamDepositMethods {
  banks: DepositMethod[];
  ewallets: DepositMethod[];
  cards: DepositMethod[];
}

export function AdminDepositMethods() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<VietnamDepositMethods>({ banks: [], ewallets: [], cards: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const data = await getBusinessSettings();
      setMethods(data?.vietnamDepositMethods || { banks: [], ewallets: [], cards: [] });
    } catch (e) {
      toast({ title: "Error", description: "Failed to load methods", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await patchBusinessSettings({ vietnamDepositMethods: methods });
      toast({ title: "Saved successfully" });
      fetchMethods();
    } catch (e) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (category: keyof VietnamDepositMethods, id: string, checked: boolean) => {
    setMethods((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === id ? { ...item, status: checked ? "active" : "maintenance" } : item
      ),
    }));
  };

  const updateField = (category: keyof VietnamDepositMethods, id: string, field: "name" | "icon", value: string) => {
    setMethods((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderCategory = (category: keyof VietnamDepositMethods) => {
    const items = methods[category];
    if (!items || items.length === 0) return <div className="p-4 text-center">Chưa có dữ liệu. Hãy khởi động lại Backend để tải dữ liệu mặc định.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {items.map((item) => (
          <Card key={item.id} className={item.status === "active" ? "border-primary/50" : "opacity-75"}>
            <CardHeader className="py-3 bg-muted/10 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <img src={item.icon} alt={item.name} className="w-6 h-6 object-contain" />
                {item.name}
              </CardTitle>
              <Switch
                checked={item.status === "active"}
                onCheckedChange={(v) => toggleStatus(category, item.id, v)}
              />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Tên hiển thị</label>
                <Input value={item.name} onChange={(e) => updateField(category, item.id, "name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">URL Logo</label>
                <Input value={item.icon} onChange={(e) => updateField(category, item.id, "icon", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách Phương Thức Gửi Tiền</h1>
          <p className="text-muted-foreground text-sm mt-1">Bật/tắt các ngân hàng, ví, thẻ cào hiển thị cho người chơi chọn khi nạp tiền.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu thay đổi
        </Button>
      </div>

      <Tabs defaultValue="banks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="banks">Ngân Hàng ({methods.banks?.length || 0})</TabsTrigger>
          <TabsTrigger value="ewallets">Ví Điện Tử ({methods.ewallets?.length || 0})</TabsTrigger>
          <TabsTrigger value="cards">Thẻ Cào ({methods.cards?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="banks">
          {renderCategory("banks")}
        </TabsContent>
        <TabsContent value="ewallets">
          {renderCategory("ewallets")}
        </TabsContent>
        <TabsContent value="cards">
          {renderCategory("cards")}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDepositMethodsPage() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminDepositMethods />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
