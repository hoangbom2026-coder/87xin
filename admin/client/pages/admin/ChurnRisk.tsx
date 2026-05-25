import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getAdminBonuses, getChurnAtRisk, postChurnOffer } from "@/lib/api";
import { Gift, RefreshCw, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

export default function ChurnRiskPage() {
  const token = getAdminToken();
  const [inactiveDays, setInactiveDays] = React.useState(5);
  const [bonusId, setBonusId] = React.useState("");
  const [amount, setAmount] = React.useState(10);
  const [goalAmount, setGoalAmount] = React.useState(100);
  const [sendNotification, setSendNotification] = React.useState(true);

  const { data, isFetching, refetch, isError } = useQuery({
    queryKey: ["admin-churn", token, inactiveDays] as const,
    queryFn: () => getChurnAtRisk(token!, { inactiveDays, limit: 50 }),
    enabled: Boolean(token),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const { data: bonuses = [] } = useQuery({
    queryKey: ["admin-bonuses", token] as const,
    queryFn: () => getAdminBonuses(token!),
    enabled: Boolean(token),
    staleTime: 120_000,
  });

  const activeBonuses = React.useMemo(
    () =>
      (bonuses as Array<Record<string, unknown>>).filter(
        (b) => b.status === true && b.isExpired !== true,
      ),
    [bonuses],
  );

  function applyBonusTemplate(id: string) {
    setBonusId(id);
    const b = activeBonuses.find((x) => String(x._id) === id) as
      | {
          bonusCap?: number;
          multiply?: number;
        }
      | undefined;
    if (!b) return;
    const cap = Number(b.bonusCap) || 100;
    const mult = Number(b.multiply) || 1;
    const amt = Math.min(50, Math.max(1, Math.round(cap * 0.1)));
    setAmount(amt);
    setGoalAmount(Number((amt * mult).toFixed(2)));
  }

  const sendOffer = useMutation({
    mutationFn: async (payload: { userId: string; username: string }) => {
      if (!token) throw new Error("Chưa đăng nhập");
      if (!bonusId) throw new Error("Chọn bonus mẫu");
      return postChurnOffer(token, {
        userId: payload.userId,
        bonusId,
        amount,
        goalAmount,
        sendNotification,
      });
    },
    onSuccess: (_data, vars) => {
      toast({
        title: "Đã gửi offer",
        description: `Bonus + thông báo (nếu bật) cho ${vars.username}.`,
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: e.message || "Không gửi được.",
      });
    },
  });

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Churn & giữ chân (MVP)"
          description={
            "Người chơi active nhưng không còn bet/win trong N ngày (theo giao dịch). " +
            "Chọn bonus mẫu + số tiền, rồi « Gửi offer » — gọi API gán player bonus và thông báo in-app."
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(inactiveDays)}
                onValueChange={(v) => setInactiveDays(Number(v))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ngưỡng im lặng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">≥ 3 ngày</SelectItem>
                  <SelectItem value="5">≥ 5 ngày</SelectItem>
                  <SelectItem value="7">≥ 7 ngày</SelectItem>
                  <SelectItem value="14">≥ 14 ngày</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className="mr-2 size-4" />
                {isFetching ? "Đang tải…" : "Làm mới"}
              </Button>
            </div>
          }
        />

        <div className="mb-4 rounded-md border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Cấu hình offer</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-1.5">
              <Label>Bonus mẫu</Label>
              <Select
                value={bonusId || undefined}
                onValueChange={applyBonusTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bonus (khuyến mãi)" />
                </SelectTrigger>
                <SelectContent>
                  {activeBonuses.map((b) => (
                    <SelectItem key={String(b._id)} value={String(b._id)}>
                      {String(b.name ?? b._id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Số tiền thưởng</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mục tiêu cược (goal)</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="send-notif"
                checked={sendNotification}
                onCheckedChange={(v) => setSendNotification(Boolean(v))}
              />
              <Label htmlFor="send-notif" className="font-normal cursor-pointer">
                Gửi thông báo in-app (chỉ user đó)
              </Label>
            </div>
          </div>
          {!activeBonuses.length ? (
            <p className="text-xs text-muted-foreground">
              Không có bonus đang bật — tạo hoặc bật bonus tại mục Bonus trước.
            </p>
          ) : null}
        </div>

        {isError ? (
          <p className="text-sm text-destructive">Không tải được dữ liệu.</p>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>
            Mốc: {data?.cutoff ? new Date(data.cutoff).toLocaleString("vi-VN") : "—"}
          </span>
          <span>·</span>
          <span>{data?.users?.length ?? 0} user</span>
          <span>·</span>
          <Link className="text-primary underline" to="/users">
            Mở Users
          </Link>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người chơi</TableHead>
                <TableHead className="text-right">Điểm rủi ro</TableHead>
                <TableHead>Ngày cược gần nhất</TableHead>
                <TableHead className="text-right">Ngày im lặng</TableHead>
                <TableHead className="text-right">Nạp (count)</TableHead>
                <TableHead className="w-[140px] text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.users ?? []).map((u) => (
                <TableRow key={String(u.userId)}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="size-4 text-muted-foreground" />
                      <span className="font-medium">{u.username}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={u.riskScore >= 80 ? "destructive" : "secondary"}>
                      {u.riskScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.lastBetAt ? new Date(u.lastBetAt).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.daysQuiet}</TableCell>
                  <TableCell className="text-right">{u.depositCount ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={
                        !bonusId ||
                        sendOffer.isPending ||
                        amount <= 0 ||
                        goalAmount <= 0
                      }
                      onClick={() =>
                        sendOffer.mutate({
                          userId: String(u.userId),
                          username: u.username,
                        })
                      }
                    >
                      <Gift className="mr-1 size-4" />
                      {sendOffer.isPending ? "Đang gửi…" : "Gửi offer"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isFetching && !(data?.users?.length ?? 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Không có user nào khớp (hoặc mọi người vẫn cược trong ngưỡng).
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          POST <code className="rounded bg-muted px-1">/api/admin/churn-offer</code> gán{" "}
          <strong>player bonus</strong> (cộng số dư bonus như nạp có KM) và tạo{" "}
          <strong>notification</strong> chỉ hiển thị cho user đích khi bật « Gửi thông báo ».
        </p>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
