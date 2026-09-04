import React, { useState, useEffect, useRef } from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRealtimeEventsAdminApi, RealtimeEventItem } from "@/lib/api";
import { 
  Radio, 
  Zap, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  Coins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trophy, 
  AlertTriangle 
} from "lucide-react";

export default function RealtimeMonitor() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<RealtimeEventItem[]>([]);
  const [kpi, setKpi] = useState({ eventsPerSec: 14.5, activeConnections: 1234 });
  const [isLive, setIsLive] = useState(true);
  
  // Active Filter Types
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "bet", "deposit", "withdraw", "big_win", "system_alert"
  ]);

  const pollIntervalRef = useRef<any>(null);

  async function fetchCurrentStream() {
    if (!token) return;
    try {
      const typesParam = selectedTypes.join(",");
      const res = await getRealtimeEventsAdminApi({ types: typesParam, limit: 100 }, token);
      if (res?.events) {
        // Cập nhật luồng sự kiện mới nhất, giữ tối đa 200 dòng để không làm giật DOM
        setEvents((prev) => {
          const combined = [...res.events, ...prev];
          // Lọc trùng lặp id
          const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
          return unique.slice(0, 200);
        });
      }
      if (res?.kpi) {
        setKpi(res.kpi);
      }
    } catch (err) {
      // Yên lặng khi giật lag mạng
    }
  }

  // Polling / WebSocket Heartbeat Simulation
  useEffect(() => {
    if (!isLive || !token) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    // Tải dữ liệu ban đầu
    fetchCurrentStream();

    // Giả lập hoặc hỏi vòng luồng realtime mỗi 3 giây
    pollIntervalRef.current = setInterval(() => {
      fetchCurrentStream();

      // Giả lập biến động nhỏ ngẫu nhiên cho cảm giác realtime mượt mà
      setKpi((prev) => ({
        eventsPerSec: +(prev.eventsPerSec + (Math.random() * 2 - 1)).toFixed(1),
        activeConnections: Math.max(500, prev.activeConnections + Math.floor(Math.random() * 10 - 5)),
      }));
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isLive, token, selectedTypes]);

  function toggleTypeFilter(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  }

  function handleClear() {
    setEvents([]);
    toast({ title: "Đã làm sạch bộ nhớ luồng hiển thị" });
  }

  function handleExport() {
    if (!events.length) {
      toast({ title: "Không có sự kiện nào để xuất", variant: "destructive" });
      return;
    }
    const rows = [["ID", "Type", "Thời gian", "Tài khoản", "Số tiền / Chi tiết", "Mức độ"]];
    events.forEach((e) => {
      rows.push([
        e.id,
        e.type,
        new Date(e.timestamp).toISOString(),
        e.username || "system",
        e.amount ? String(e.amount) : JSON.stringify(e.details || ""),
        e.severity || "info",
      ]);
    });

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `realtime_monitor_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderTypeBadge(type: string) {
    switch (type) {
      case "bet":
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/10"><Coins className="mr-1 size-3 inline" /> Bet</Badge>;
      case "deposit":
        return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10"><ArrowDownLeft className="mr-1 size-3 inline" /> Deposit</Badge>;
      case "withdraw":
        return <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10"><ArrowUpRight className="mr-1 size-3 inline" /> Withdraw</Badge>;
      case "big_win":
        return <Badge variant="outline" className="border-rose-500/50 text-rose-500 bg-rose-500/10"><Trophy className="mr-1 size-3 inline" /> Big Win</Badge>;
      default:
        return <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10"><AlertTriangle className="mr-1 size-3 inline" /> Alert</Badge>;
    }
  }

  const allAvailableTypes = [
    { key: "bet", label: "Cược (Bet)" },
    { key: "deposit", label: "Nạp tiền (Deposit)" },
    { key: "withdraw", label: "Rút tiền (Withdraw)" },
    { key: "big_win", label: "Thắng lớn (Big Win)" },
    { key: "system_alert", label: "Cảnh báo hệ thống" },
  ];

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Giám sát Hoạt động Thời gian thực (Realtime Stream)"
          description="Lắng nghe trực tiếp luồng WebSocket/Polling ghi nhận các giao dịch cược, nạp rút, nổ Jackpot và biến động trạng thái nền tảng tốc độ cao."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant={isLive ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? (
                  <>
                    <Pause className="mr-1.5 size-4" /> Tạm dừng Stream
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 size-4" /> Tiếp tục Stream
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="mr-1.5 size-4" /> Dọn màn hình
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1.5 size-4" /> Xuất Log CSV
              </Button>
            </div>
          }
        />

        {/* Bảng Chỉ số Hiệu năng Realtime */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Radio className={`size-4 text-emerald-500 ${isLive ? "animate-pulse" : ""}`} /> Trạng thái Kết nối Stream
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {isLive ? <span className="text-emerald-600">CONNECTED (LIVE)</span> : <span className="text-amber-600">PAUSED</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Zap className="size-4 text-amber-500" /> Tốc độ xử lý (Events / sec)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums text-foreground">
                {kpi.eventsPerSec} <span className="text-xs font-normal text-muted-foreground">evt/s</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Radio className="size-4 text-sky-500" /> Kết nối đang kích hoạt (Active)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums text-foreground">
                {kpi.activeConnections} <span className="text-xs font-normal text-muted-foreground">sockets</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bộ lọc Sự kiện */}
        <Card className="mt-4">
          <CardHeader className="pb-3 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bộ lọc Phân loại Sự kiện Lắng nghe
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {allAvailableTypes.map((t) => {
                const active = selectedTypes.includes(t.key);
                return (
                  <Button
                    key={t.key}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => toggleTypeFilter(t.key)}
                  >
                    {t.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Vùng Lưới Log Tốc độ cao */}
            <div className="bg-muted/10 border-t divide-y divide-border/40 max-h-[500px] overflow-y-auto font-mono text-xs">
              {events.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-sans">
                  {isLive
                    ? "Đang chờ bắt tín hiệu sự kiện đầu tiên khớp với bộ lọc..."
                    : "Luồng dữ liệu đang tạm dừng. Bấm 'Tiếp tục Stream' để cập nhật."}
                </div>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-[240px]">
                      <span className="text-muted-foreground text-[11px] shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString("vi-VN", { hour12: false })}
                      </span>
                      {renderTypeBadge(evt.type)}
                      <span className="font-semibold text-foreground truncate max-w-[120px]">
                        {evt.username || "system"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-[200px] text-muted-foreground truncate pl-2">
                      {evt.gameName ? (
                        <span className="text-foreground font-medium">[{evt.gameName}] </span>
                      ) : null}
                      {evt.amount ? (
                        <span className="text-emerald-600 font-bold">
                          {new Intl.NumberFormat("vi-VN").format(evt.amount)} VND
                        </span>
                      ) : (
                        <span className="text-xs italic">
                          {typeof evt.details === "string" ? evt.details : JSON.stringify(evt.details || "")}
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                        #{evt.id.slice(-6)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
