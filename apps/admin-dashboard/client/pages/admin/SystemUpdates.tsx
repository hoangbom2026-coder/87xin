import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@game/ui/card";
import { Progress } from "@game/ui/progress";
import { toast } from "@game/ui/use-toast";
import { getSystemInfoApi, type SystemInfo } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { Activity, Cpu, Database, GitBranch, RefreshCw, Server } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function fmtUptime(sec: number): string {
  if (!Number.isFinite(sec)) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function SystemUpdatesPage() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const r = await getSystemInfoApi(token);
      setInfo(r);
    } catch (e: any) {
      toast({ title: "Lỗi tải system info", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  if (!info) {
    return <AdminLayout><div className="text-muted-foreground">Đang tải…</div></AdminLayout>;
  }

  const memUsedPct = info.memory.sysTotalMb
    ? Math.min(100, Math.round(((info.memory.sysTotalMb - info.memory.sysFreeMb) / info.memory.sysTotalMb) * 100))
    : 0;
  const heapPct = info.memory.heapTotalMb
    ? Math.min(100, Math.round((info.memory.heapUsedMb / info.memory.heapTotalMb) * 100))
    : 0;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Activity className="size-6" /> System Updates</h1>
          <p className="text-sm text-muted-foreground">Trạng thái runtime, build và changelog hệ thống.</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="mr-2 size-4" /> Làm mới
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="size-4" /> Ứng dụng</CardTitle>
            <CardDescription>{info.app.name}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row k="Phiên bản" v={<Badge variant="secondary">v{info.app.version}</Badge>} />
            <Row k="Môi trường" v={<Badge>{info.app.env}</Badge>} />
            <Row k="Khởi động lúc" v={<span className="text-xs">{new Date(info.app.startedAt).toLocaleString("vi-VN")}</span>} />
            <Row k="Uptime" v={<span className="font-mono text-xs">{fmtUptime(info.app.uptimeSec)}</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="size-4" /> Runtime</CardTitle>
            <CardDescription>Node {info.runtime.node}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row k="Platform" v={<span className="text-xs">{info.runtime.platform}</span>} />
            <Row k="Arch" v={info.runtime.arch} />
            <Row k="CPU" v={`${info.runtime.cpus} core`} />
            <Row k="Load 1/5/15 min" v={<span className="font-mono text-xs">{info.runtime.loadavg.map((n) => n.toFixed(2)).join(" / ")}</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="size-4" /> Database</CardTitle>
            <CardDescription>MongoDB</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row k="State" v={<Badge variant={info.database.state === "connected" ? "default" : "destructive"}>{info.database.state}</Badge>} />
            <Row k="Host" v={<span className="text-xs">{info.database.host || "—"}</span>} />
            <Row k="Database" v={<span className="text-xs">{info.database.name || "—"}</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitBranch className="size-4" /> Git build</CardTitle>
            <CardDescription>Mã nguồn hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row k="Branch" v={info.git.branch ?? "—"} />
            <Row k="Commit" v={<code className="text-xs">{info.git.commit ?? "—"}</code>} />
            <Row k="Commit time" v={<span className="text-xs">{info.git.date ? new Date(info.git.date).toLocaleString("vi-VN") : "—"}</span>} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Bộ nhớ</CardTitle>
          <CardDescription>Sử dụng RAM của process & hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>System RAM ({info.memory.sysTotalMb} MB total)</span>
              <span>{(info.memory.sysTotalMb - info.memory.sysFreeMb).toLocaleString()} / {info.memory.sysTotalMb.toLocaleString()} MB</span>
            </div>
            <Progress value={memUsedPct} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Node heap</span>
              <span>{info.memory.heapUsedMb} / {info.memory.heapTotalMb} MB (rss {info.memory.rssMb} MB)</span>
            </div>
            <Progress value={heapPct} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Changelog</CardTitle>
          <CardDescription>Đọc từ <code>CHANGELOG.md</code> nếu có</CardDescription>
        </CardHeader>
        <CardContent>
          {info.changelog ? (
            <pre className="bg-muted/50 p-3 rounded text-xs overflow-auto max-h-[400px] whitespace-pre-wrap">
              {typeof info.changelog === 'string' ? info.changelog : JSON.stringify(info.changelog, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có file CHANGELOG.md</p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
