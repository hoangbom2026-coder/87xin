import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { toast } from "@/components/ui/use-toast";
import {
  getReferralCodes,
  getReferralStatus,
  createReferralCodeApi,
  patchReferralCommissionApi,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

const token = () => getAdminToken() || "";

type RefCode = { _id: string; name: string; code: string; commissionRate: number; referralCount?: number; createdAt: string };

export default function AdminReferrals() {
  const [rows, setRows] = React.useState<RefCode[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{ friendCount: number; referralCount: number }|null>(null);
  const [savingCode, setSavingCode] = React.useState<string | null>(null);
  const [rateInputs, setRateInputs] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const t = token();
      const [codes, stat] = await Promise.all([
        getReferralCodes(t),
        getReferralStatus(t),
      ]);
      const list = (((codes as any)?.items || []) as RefCode[]);
      setRows(list);
      const nextDraft: Record<string, string> = {};
      for (const r of list) {
        nextDraft[r._id] = String(r.commissionRate ?? "");
      }
      setRateInputs(nextDraft);
      setStatus(stat || null);
      toast({ title: "Đã tải dữ liệu referral" });
    } catch (e:any) {
      toast({ title: "Tải dữ liệu thất bại", description: e?.message||"", variant: "destructive" });
    } finally { setLoading(false); }
  }

  React.useEffect(()=>{ load(); },[]);

  function formatRate(rate: number) {
    const n = Number(rate);
    if (Number.isNaN(n)) return "-";
    return `${(n * 100).toFixed(2)}% (${n})`;
  }

  async function saveCommission(r: RefCode) {
    const raw = rateInputs[r._id];
    const n = Number(raw);
    if (raw === undefined || Number.isNaN(n)) {
      toast({ title: "commissionRate không hợp lệ", variant: "destructive" });
      return;
    }
    if (n < 0 || n > 1) {
      toast({ title: "commissionRate phải trong [0, 1]", variant: "destructive" });
      return;
    }
    try {
      setSavingCode(r.code);
      await patchReferralCommissionApi(r.code, n, token());
      toast({ title: `Đã cập nhật ${r.code}` });
      await load();
    } catch (e:any) {
      toast({ title: "Cập nhật thất bại", description: e?.message||"", variant: "destructive" });
    } finally {
      setSavingCode(null);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    try {
      await createReferralCodeApi(name, token());
      toast({ title: "Đã tạo referral code" });
      setName("");
      await load();
    } catch (e:any) {
      toast({ title: "Tạo mới thất bại", description: e?.message||"", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold md:text-xl">Quản lý referral code</h1>
          <div className="text-sm text-muted-foreground">{status?`Bạn bè: ${status.friendCount} • Số code tối đa: ${status.referralCount}`:""}</div>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Tạo referral code</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="flex flex-wrap items-center gap-2 w-full">
              <Input className="w-full sm:w-80" placeholder="Nhãn (tên nội bộ)" value={name} onChange={(e)=>setName(e.target.value)} required />
              <Button type="submit" className="w-full sm:w-auto">Tạo</Button>
              <Button type="button" variant="outline" onClick={load} disabled={loading} className="w-full sm:w-auto">{loading?"Đang tải...":"Làm mới"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Danh sách referral code</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>Hoa hồng (0–1)</TableHead>
                    <TableHead>Giới thiệu</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r)=> (
                    <TableRow key={r._id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Input
                            className="h-8 max-w-[140px] font-mono text-xs"
                            value={rateInputs[r._id] ?? ""}
                            onChange={(e) =>
                              setRateInputs((m) => ({ ...m, [r._id]: e.target.value }))
                            }
                          />
                          <span className="text-[11px] text-muted-foreground">
                            Hiện tại: {formatRate(Number(r.commissionRate))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{r.referralCount ?? "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={savingCode === r.code}
                          onClick={() => void saveCommission(r)}
                        >
                          {savingCode === r.code ? "Đang lưu…" : "Lưu"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length===0 && (
                    <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">Chưa có referral code</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <div className="grid gap-3 md:hidden">
              {rows.map((r)=> (
                <div key={r._id} className="rounded-lg border p-3 grid gap-1">
                  <div className="font-medium">{r.name}</div>
                  <div className="font-mono text-xs break-all">{r.code}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tỷ lệ</span>
                    <span className="font-mono text-xs">{formatRate(Number(r.commissionRate))}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Giới thiệu</span>
                    <span>{r.referralCount ?? "-"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
              {rows.length===0 && (
                <div className="text-sm text-muted-foreground">Chưa có referral code</div>
              )}
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
