import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Link } from "react-router-dom";

export default function UserInterestLogPage() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Nhật ký sở thích người dùng"
          description="Theo dõi preference / hành vi — có thể mở rộng từ API preference hoặc pipeline analytics."
        />
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Điểm vào dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Trang <strong>Preference</strong> quản lý cấu hình bot/tiền tệ gắn admin; log hành vi người chơi nên
              bổ sung collection riêng hoặc export từ analytics.
            </p>
            <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
              <Link to="/preference">Mở Preference</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
              <Link to="/audit-logs">Nhật ký audit admin</Link>
            </Button>
            <p className="text-xs">
              <Link to="/settings/system" className="text-primary underline-offset-4 hover:underline">
                ← Trung tâm cài đặt
              </Link>
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
