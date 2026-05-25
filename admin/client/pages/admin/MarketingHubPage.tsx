import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import MarketingIntegrationsTab from "./MarketingIntegrationsTab";
import { BannersPanel } from "./Banners";
import { ContentBlocksPanel } from "./ContentBlocks";
import { MarketingPromotionsPanel } from "./MarketingPromotions";
import { NotificationsPanel } from "./Notifications";
import { PromotionsPanel } from "./Promotions";

const TAB_IDS = ["integrations", "banners", "cms", "bonus", "blocks", "notify", "more"] as const;
type HubTab = (typeof TAB_IDS)[number];

function isHubTab(v: string | null): v is HubTab {
  return v !== null && (TAB_IDS as readonly string[]).includes(v);
}

export default function MarketingHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: HubTab = isHubTab(rawTab) ? rawTab : "integrations";

  function setTab(next: string) {
    setSearchParams({ tab: next });
  }

  return (
    <AdminLayout>
        <AdminPageHeader
          title="Trung tâm Marketing"
          description="Tab gọn một hàng — CMS khuyến mãi, banner, bonus, blocks, thông báo và tích hợp key/URL. Các đường dẫn cũ (/banners, /promotions, …) vẫn dùng được."
        />

        <Tabs value={tab} onValueChange={setTab} className="mt-2 w-full">
          <TabsList className="mb-6 grid h-auto w-full shrink-0 grid-cols-2 gap-2 p-2 sm:flex sm:flex-wrap sm:justify-start">
            <TabsTrigger value="integrations" className="flex-1 sm:flex-none">
              Tích hợp
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex-1 sm:flex-none">
              Banners
            </TabsTrigger>
            <TabsTrigger value="cms" className="flex-1 sm:flex-none">
              KM (CMS)
            </TabsTrigger>
            <TabsTrigger value="bonus" className="flex-1 sm:flex-none">
              Bonus
            </TabsTrigger>
            <TabsTrigger value="blocks" className="flex-1 sm:flex-none">
              Blocks
            </TabsTrigger>
            <TabsTrigger value="notify" className="flex-1 sm:flex-none">
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="more" className="flex-1 sm:flex-none sm:min-w-[7rem]">
              Thêm →
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="mt-0 outline-none focus-visible:ring-0">
            <MarketingIntegrationsTab />
          </TabsContent>
          <TabsContent value="banners" className="mt-0 space-y-4 outline-none">
            <BannersPanel />
          </TabsContent>
          <TabsContent value="cms" className="mt-0 space-y-4 outline-none">
            <MarketingPromotionsPanel />
          </TabsContent>
          <TabsContent value="bonus" className="mt-0 space-y-4 outline-none">
            <PromotionsPanel />
          </TabsContent>
          <TabsContent value="blocks" className="mt-0 space-y-4 outline-none">
            <ContentBlocksPanel />
          </TabsContent>
          <TabsContent value="notify" className="mt-0 space-y-4 outline-none">
            <NotificationsPanel />
          </TabsContent>
          <TabsContent value="more" className="mt-0 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Liên kết nhanh</CardTitle>
                <CardDescription>
                  Affiliate, VIP và cài đặt site — mở tab riêng khi form dài.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  ["/affiliate-program", "Chương trình Affiliate", "Tiền, tier, payout, CMS…"],
                  ["/marketing-affiliate-web", "Giao diện Affiliate (web)", "Trang affiliate người chơi"],
                  ["/vip", "VIP 0–8", "Ngưỡng XP, badge, quyền lợi"],
                  ["/site-settings", "Cài đặt chung Site", "Bảo trì, hero, OG, popup"],
                ].map(([to, title, hint]) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground">{hint}</div>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 opacity-70" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </AdminLayout>
  );
}
