import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Link } from "react-router-dom";

export default function ManageLanguagesPage() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Quản lý ngôn ngữ"
          description="Chuỗi UI đa ngôn ngữ thường nằm trong mã nguồn frontend (JSON/YAML locale), không lưu Mongo mặc định."
        />
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Hướng dẫn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Dự án app người chơi: tìm thư mục <code className="rounded bg-muted px-1">locales</code> hoặc cấu hình
              i18n trong workspace frontend tương ứng.
            </p>
            <p>
              Admin panel này dùng nhãn tiếng Việt cố định trong component; muốn đa ngôn ngữ admin → thêm i18n cho
              package <code className="rounded bg-muted px-1">admin/client</code>.
            </p>
            <p>
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
