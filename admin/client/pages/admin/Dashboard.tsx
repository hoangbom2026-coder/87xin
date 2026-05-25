import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Link } from "react-router-dom";
import {
  LineChart,
  Megaphone,
  Shield,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
  Gamepad2,
  AlertTriangle,
  Radio,
  Trophy,
  Share2,
  ClipboardList,
} from "lucide-react";
import { getAdminDashboard } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    n,
  );
}

function dayShort(iso: string) {
  const p = iso.slice(5, 10);
  return p.replace("-", "/");
}

type OperationalBriefItem = {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  detail: string;
  actions: { label: string; href: string }[];
};

function briefSeverityClass(s: OperationalBriefItem["severity"]) {
  switch (s) {
    case "critical":
      return "border-destructive/60 bg-destructive/10";
    case "warning":
      return "border-amber-500/55 bg-amber-500/[0.08]";
    case "info":
      return "border-sky-500/40 bg-sky-500/[0.06]";
    default:
      return "border-emerald-500/40 bg-emerald-500/[0.07]";
  }
}

function BriefSeverityBadge({ s }: { s: OperationalBriefItem["severity"] }) {
  const label =
    s === "critical"
      ? "Ưu tiên"
      : s === "warning"
        ? "Cảnh báo"
        : s === "info"
          ? "Lưu ý"
          : "Ổn định";
  const variant =
    s === "critical"
      ? "destructive"
      : s === "warning"
        ? "outline"
        : s === "info"
          ? "secondary"
          : "default";
  return (
    <Badge variant={variant as any} className="shrink-0 text-[10px] uppercase tracking-wide">
      {label}
    </Badge>
  );
}

export default function AdminDashboard() {
  const { token: authToken } = useAuth();
  const [days, setDays] = React.useState(14);

  const { data: dash, isFetching, refetch, isError } = useQuery({
    queryKey: ["admin-dashboard", authToken, days] as const,
    queryFn: () => getAdminDashboard(authToken!, days),
    enabled: Boolean(authToken),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usageVol = React.useMemo(() => {
    const rows = dash?.charts?.volumeDaily || [];
    return rows.map((r: any) => ({
      d: dayShort(r.date),
      deposits: Number(r.deposits || 0),
      withdrawals: Number(r.withdrawals || 0),
    }));
  }, [dash]);

  const usageCount = React.useMemo(() => {
    const dep = dash?.charts?.depositsDailyCount || [];
    const wd = dash?.charts?.withdrawalsDailyCount || [];
    return dep.map((r: any, i: number) => ({
      d: dayShort(r.date),
      dep: r.count,
      wd: wd[i]?.count ?? 0,
    }));
  }, [dash]);

  const regSeries = React.useMemo(() => {
    const rows = dash?.charts?.registrationsDaily || [];
    return rows.map((r: any) => ({
      d: dayShort(r.date),
      users: r.count,
    }));
  }, [dash]);

  const typeShare = React.useMemo(() => {
    const mix = dash?.transactionsMix || [];
    if (!mix.length) return [{ label: "n/a", value: 1 }];
    return mix.slice(0, 6).map((m: any) => ({
      label: m.type,
      value: m.share,
    }));
  }, [dash]);

  function exportCSV() {
    if (!dash) return;
    const rows: string[][] = [["section", "key", "value"]];
    rows.push([
      "users",
      "total",
      String(dash.users?.total ?? ""),
    ]);
    rows.push([
      "users",
      "players",
      String(dash.users?.players ?? ""),
    ]);
    rows.push([
      "finance",
      "depositSuccessAmount",
      String(dash.finance?.deposits?.successAmount ?? ""),
    ]);
    rows.push([
      "finance",
      "withdrawSuccessAmount",
      String(dash.finance?.withdrawals?.successAmount ?? ""),
    ]);
    const aD = dash.affiliate as
      | {
          referralCodesTotal?: number;
          referredPlayersTotal?: number;
          commissionAccruedTotal?: number;
          referralAccruedTotal?: number;
          newLedgerRowsInPeriod?: number;
        }
      | undefined;
    if (aD) {
      rows.push(["affiliate", "referralCodes", String(aD.referralCodesTotal ?? "")]);
      rows.push(["affiliate", "referredPlayers", String(aD.referredPlayersTotal ?? "")]);
      rows.push(["affiliate", "commissionAccrued", String(aD.commissionAccruedTotal ?? "")]);
      rows.push(["affiliate", "referralAccrued", String(aD.referralAccruedTotal ?? "")]);
      rows.push(["affiliate", "ledgerNewInPeriod", String(aD.newLedgerRowsInPeriod ?? "")]);
    }
    (dash.recentActivity || []).forEach((a: any) =>
      rows.push([
        "tx",
        new Date(a.time).toISOString(),
        `${a.type} ${a.amount} ${a.currencyName} ${a.username}`,
      ]),
    );
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-dashboard.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const u = dash?.users;
  const f = dash?.finance;
  const g = dash?.gaming;
  const op = dash?.operations;
  const ses = dash?.sessions;
  const aff = dash?.affiliate;

  const kpi: {
    t: string;
    v: string;
    icon: any;
    color: string;
  }[] = dash
    ? [
        {
          t: "Tổng tài khoản",
          v: String(u?.total ?? 0),
          icon: Users,
          color: "text-sky-600 bg-sky-600/15",
        },
        {
          t: "Người chơi (user)",
          v: `${u?.players ?? 0} / hoạt động ${u?.activePlayers ?? 0}`,
          icon: Users,
          color: "text-emerald-600 bg-emerald-600/15",
        },
        {
          t: "Đăng ký (trong kỳ)",
          v: String(u?.registeredInPeriod ?? 0),
          icon: Users,
          color: "text-cyan-600 bg-cyan-600/15",
        },
        {
          t: "Phiên đăng nhập (còn hạn)",
          v: String(ses?.activeCount ?? 0),
          icon: Radio,
          color: "text-lime-500 bg-lime-500/15",
        },
        {
          t: "User online (ước lượng)",
          v: String(ses?.uniquePlayersOnline ?? 0),
          icon: Radio,
          color: "text-green-500 bg-green-500/15",
        },
        {
          t: "Nạp thành công (kỳ)",
          v: `${f?.deposits?.successCount ?? 0} lệnh / $${fmt(f?.deposits?.successAmount ?? 0)}`,
          icon: CreditCard,
          color: "text-emerald-600 bg-emerald-600/15",
        },
        {
          t: "Rút thành công (kỳ)",
          v: `${f?.withdrawals?.successCount ?? 0} lệnh / $${fmt(f?.withdrawals?.successAmount ?? 0)}`,
          icon: CreditCard,
          color: "text-violet-600 bg-violet-600/15",
        },
        {
          t: "Chờ xử lý",
          v: `Nạp ${f?.deposits?.pendingCount ?? 0} · Rút ${f?.withdrawals?.pendingCount ?? 0}`,
          icon: CreditCard,
          color: "text-amber-600 bg-amber-600/15",
        },
        {
          t: "KYC chờ duyệt",
          v: String(op?.pendingKyc ?? 0),
          icon: Shield,
          color: "text-amber-600 bg-amber-600/15",
        },
        {
          t: "Bonus đang bật",
          v: String(op?.activeBonuses ?? 0),
          icon: Megaphone,
          color: "text-sky-600 bg-sky-600/15",
        },
        {
          t: "Thông báo (active)",
          v: String(op?.activeNotifications ?? 0),
          icon: Megaphone,
          color: "text-rose-600 bg-rose-600/15",
        },
        {
          t: "Tổng ví (amount)",
          v: `$${fmt(f?.balances?.totalWalletAmount ?? 0)}`,
          icon: Wallet,
          color: "text-indigo-600 bg-indigo-600/15",
        },
        {
          t: "Rút được (sum)",
          v: `$${fmt(f?.balances?.totalWithdrawable ?? 0)}`,
          icon: Wallet,
          color: "text-teal-600 bg-teal-600/15",
        },
        {
          t: "GGR ước tính (kỳ)",
          v: `$${fmt(g?.ggrEstimate ?? 0)}`,
          icon: Gamepad2,
          color: "text-orange-600 bg-orange-600/15",
        },
        {
          t: "RTP (cược/thắng)",
          v:
            g?.rtpPercent != null
              ? `${g.rtpPercent.toFixed(2)}%`
              : "—",
          icon: Gamepad2,
          color: "text-fuchsia-600 bg-fuchsia-600/15",
        },
        {
          t: "Mã giới thiệu đang có",
          v: String(aff?.referralCodesTotal ?? 0),
          icon: Share2,
          color: "text-teal-500 bg-teal-500/15",
        },
        {
          t: "Player được giới thiệu (có referrer)",
          v: String(aff?.referredPlayersTotal ?? 0),
          icon: Users,
          color: "text-cyan-500 bg-cyan-500/15",
        },
        {
          t: "Hoa hồng tích luỹ (ledger sổ cái)",
          v: `${fmt(Number(aff?.commissionAccruedTotal ?? 0))} · ref ${fmt(Number(aff?.referralAccruedTotal ?? 0))}`,
          icon: Wallet,
          color: "text-amber-500 bg-amber-500/15",
        },
        {
          t: "Bút toán ledger mới (trong kỳ)",
          v: String(aff?.newLedgerRowsInPeriod ?? 0),
          icon: TrendingUp,
          color: "text-lime-600 bg-lime-600/15",
        },
      ]
    : [];

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Bảng điều khiển vận hành"
          description={
            "KPI realtime (~30s), biểu đồ và Top win — Affiliate & tài chính gộp trong một chỗ. " +
            (dash?.generatedAt
              ? `Cập nhật: ${new Date(dash.generatedAt).toLocaleString("vi-VN")}.`
              : "")
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(days)}
                onValueChange={(v) => setDays(Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="14">14 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? "Đang tải…" : "Làm mới"}
              </Button>
              <Button variant="outline" onClick={exportCSV} disabled={!dash}>
                Export CSV
              </Button>
            </div>
          }
        />

        {isError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Không tải được dashboard</AlertTitle>
            <AlertDescription>Thử Làm mới hoặc kiểm tra token admin.</AlertDescription>
          </Alert>
        ) : null}

        {dash?.operationalBriefing && (dash.operationalBriefing as OperationalBriefItem[]).length ? (
          <Card className="mt-4 border-primary/20">
            <CardHeader className="space-y-1 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <ClipboardList className="size-4" />
                </span>
                <CardTitle className="text-base">Đánh giá nhanh &amp; hướng xử lý</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground pl-11 sm:pl-0">
                Gợi ý heuristic từ dữ liệu dashboard + cờ marketing/affiliate — ưu tiên đọc ô đỏ, cam trước khi chỉnh biểu đồ.
              </p>
            </CardHeader>
            <CardContent className="max-h-[min(480px,55vh)] space-y-3 overflow-y-auto pr-1">
              {(dash.operationalBriefing as OperationalBriefItem[]).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-3 sm:p-4",
                    briefSeverityClass(item.severity),
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
                    <div className="font-medium text-sm leading-snug">{item.title}</div>
                    <BriefSeverityBadge s={item.severity} />
                  </div>
                  {item.detail ? (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                  ) : null}
                  {item.actions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.actions.map((a) => (
                        <Button key={`${item.id}-${a.label}`} asChild size="sm" variant="secondary">
                          <Link to={a.href}>{a.label}</Link>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {!dash && isFetching ? (
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 14 }).map((_, i) => (
              <Card key={`sk-${String(i)}`}>
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className={
              "mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" +
              (isFetching ? " opacity-80 transition-opacity" : "")
            }
          >
            {kpi.map((k) => (
              <Card key={k.t}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
                    {k.t}
                  </CardTitle>
                  <span
                    className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ${k.color}`}
                  >
                    <k.icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="break-words text-lg font-semibold tabular-nums sm:text-xl">
                    {k.v}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600">
                  <Trophy className="size-4" />
                </span>
                <CardTitle className="text-base">Top thắng lớn (giao dịch win trong kỳ)</CardTitle>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/audit-logs">Nhật ký audit</Link>
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-2 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Người chơi</TableHead>
                    <TableHead>Trò chơi</TableHead>
                    <TableHead className="text-right">Thắng</TableHead>
                    <TableHead className="whitespace-nowrap">Thời điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dash?.topWinners ?? []).map((w: any) => (
                    <TableRow key={`${w.rank}-${w.username}-${w.createdAt}`}>
                      <TableCell>{w.rank}</TableCell>
                      <TableCell className="font-medium">{w.username}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{w.gameName || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">
                        {fmt(Number(w.winAmount ?? 0))} {w.currencyName || ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {w.createdAt ? new Date(w.createdAt).toLocaleString("vi-VN") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!dash?.topWinners?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        Chưa có giao dịch win trong kỳ — hoặc dữ liệu đang đồng bộ.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link to="/financial" className="flex min-w-0 items-center">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600">
                <CreditCard className="size-4" />
              </span>
              <span className="ml-2 truncate">Financial</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link to="/users" className="flex min-w-0 items-center">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-600">
                <Users className="size-4" />
              </span>
              <span className="ml-2 truncate">Users</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link to="/casino-games" className="flex min-w-0 items-center">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-600">
                <LineChart className="size-4" />
              </span>
              <span className="ml-2 truncate">Casino & Slots</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link to="/affiliate-program" className="flex min-w-0 items-center">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-teal-500/15 text-teal-600">
                <Share2 className="size-4" />
              </span>
              <span className="ml-2 truncate">F‑Infinity</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link to="/promotions" className="flex min-w-0 items-center">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600">
                <Megaphone className="size-4" />
              </span>
              <span className="ml-2 truncate">Promotions</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link to="/kyc" className="flex min-w-0 items-center">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600">
                <Shield className="size-4" />
              </span>
              <span className="ml-2 truncate">KYC</span>
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Đăng ký người chơi theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  users: { label: "Đăng ký", color: "hsl(var(--chart-1))" },
                }}
                className="aspect-auto h-[220px] w-full sm:h-[260px]"
              >
                <AreaChart data={regSeries}>
                  <defs>
                    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--chart-1))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--chart-1))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#gr)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Khối lượng nạp / rút ($, theo ngày)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  deposits: { label: "Nạp", color: "hsl(var(--chart-1))" },
                  withdrawals: {
                    label: "Rút",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="aspect-auto h-[220px] w-full sm:h-[260px]"
              >
                <AreaChart data={usageVol}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1) / 0.2)"
                  />
                  <Area
                    type="monotone"
                    dataKey="withdrawals"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2) / 0.2)"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Số lệnh nạp / rút (theo ngày)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  dep: { label: "Nạp", color: "hsl(var(--chart-1))" },
                  wd: { label: "Rút", color: "hsl(var(--chart-2))" },
                }}
                className="aspect-auto h-[220px] w-full sm:h-[260px]"
              >
                <AreaChart data={usageCount}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="dep" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.15)" />
                  <Area type="monotone" dataKey="wd" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.15)" />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ loại giao dịch (trong kỳ)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  share: { label: "Tỷ lệ", color: "hsl(var(--chart-3))" },
                }}
                className="aspect-auto h-[220px] w-full sm:h-[260px]"
              >
                <BarChart
                  data={typeShare.map((r) => ({
                    plan: r.label,
                    share: Math.round(r.value * 100),
                  }))}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="plan" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="share" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Hoạt động gần đây (transactions)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="max-h-[400px] space-y-2 overflow-auto text-sm">
                {(dash?.recentActivity || []).map((a: any, i: number) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-start gap-2 rounded border p-2 sm:gap-3"
                  >
                    <span className="mt-0.5 w-36 shrink-0 text-xs text-muted-foreground">
                      {new Date(a.time).toLocaleString("vi-VN")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {a.type} · {fmt(Number(a.amount || 0))} {a.currencyName || ""}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.username} {a.category ? `· ${a.category}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
                {!dash?.recentActivity?.length && (
                  <li className="text-sm text-muted-foreground">Chưa có dữ liệu.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <TrendingUp className="mb-1 inline size-4 align-text-bottom" />{" "}
          GGR/RTP tính trên giao dịch loại <code className="text-xs">bet</code> /{" "}
          <code className="text-xs">win</code> trong kỳ; số dư ví là tổng toàn bộ currency (
          không quy đổi FX).
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
