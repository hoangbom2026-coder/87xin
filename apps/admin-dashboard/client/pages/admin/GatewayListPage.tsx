import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings } from "@/lib/api";
import {
  GATEWAY_LABELS_VI,
  PAYMENT_GATEWAY_SLUGS,
  type SystemIntegrationsDoc,
} from "@/lib/system-integrations-meta";
import { toast } from "@game/ui/use-toast";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

const tk = () => getAdminToken() || "";

export default function GatewayListPage() {
  const [doc, setDoc] = React.useState<SystemIntegrationsDoc | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    const t = tk();
    if (!t) return;
    setLoading(true);
    try {
      const raw = (await getBusinessSettings(t)) as { systemIntegrations?: SystemIntegrationsDoc };
      setDoc(raw.systemIntegrations ?? null);
    } catch (e: unknown) {
      toast({
        title: "Không tải được cổng",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <AdminPageHeader
            title="Cổng thanh toán"
            description="Chọn cổng để nhập khóa API, webhook và ghi chú. Lưu từng cổng ở trang chi tiết."
          />
          <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />
            Tải lại
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Danh sách</CardTitle>
          </CardHeader>
          <CardContent>
            {!doc ? (
              <p className="text-sm text-muted-foreground">{loading ? "Đang tải…" : "Không có dữ liệu"}</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {PAYMENT_GATEWAY_SLUGS.map((slug) => {
                  const slot = doc.gateways[slug];
                  const on = Boolean(slot?.enabled);
                  return (
                    <li key={slug}>
                      <Link
                        to={`/settings/gateways/${slug}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-muted/50"
                      >
                        <span className="font-medium">{GATEWAY_LABELS_VI[slug]}</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-muted-foreground">{slug}</code>
                          <Badge variant={on ? "default" : "secondary"}>{on ? "Bật" : "Tắt"}</Badge>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground">
          <Link to="/settings/system" className="text-primary underline-offset-4 hover:underline">
            ← Trung tâm cài đặt hệ thống
          </Link>
        </p>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
