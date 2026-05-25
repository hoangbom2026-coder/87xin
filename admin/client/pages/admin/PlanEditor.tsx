import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createPlan, deletePlan, getPlan, updatePlan } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

const tk = () => getAdminToken() || "";

const defaultForm = {
  name: "",
  description: "",
  amountType: 0 as 0 | 1,
  minimum: 100,
  maximum: 999,
  amount: 0,
  interest: 2.5,
  interestStatus: "percentage" as "percentage" | "fixed",
  times: 5,
  returnFor: 1 as 0 | 1,
  repeatTime: 30,
  capitalBack: 0 as 0 | 1,
  userInvestLimit: 5,
  status: "active" as "active" | "inactive",
  features: "",
  referral: {
    levels: ["F1", "F2", "F3"],
    commissions: [1, 1, 1]
  }
};

export default function PlanEditorPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = React.useState(defaultForm);
  const [loading, setLoading] = React.useState(isEdit);

  React.useEffect(() => {
    if (!isEdit || !id) return;
    getPlan(id, tk())
      .then((p) =>
        setForm({
          ...defaultForm,
          ...p,
          features: Array.isArray(p.features) ? p.features.join("\n") : "",
          referral: p.referral || defaultForm.referral,
        } as any)
      )
      .catch((e) =>
        toast({ title: "Không tải được sản phẩm", description: e?.message || "", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.amountType === 0 && Number(form.minimum) >= Number(form.maximum)) {
      toast({ title: "Validate lỗi", description: "Minimum phải nhỏ hơn Maximum", variant: "destructive" });
      return;
    }
    if (form.amountType === 1 && Number(form.amount) <= 0) {
      toast({ title: "Validate lỗi", description: "Amount fixed phải > 0", variant: "destructive" });
      return;
    }
    if (form.returnFor === 1 && Number(form.repeatTime) < 1) {
      toast({ title: "Validate lỗi", description: "How many times bắt buộc khi Return for = Period", variant: "destructive" });
      return;
    }
    const payload: any = {
      ...form,
      features: form.features
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    };
    try {
      if (isEdit && id) await updatePlan(id, payload, tk());
      else await createPlan(payload, tk());
      toast({ title: isEdit ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm" });
      navigate("/admin/plans");
    } catch (e: any) {
      toast({ title: "Lưu thất bại", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <section className="space-y-4">
          <div className="section-header">
            <h1 className="text-lg font-semibold">Cài Đặt Sản Phẩm</h1>
          </div>
          <div className="row">
            <div className="col-md-12 stretch-card">
              <Card>
                <CardHeader>
                  <Button asChild>
                    <Link to="/admin/plans">Mặt sau</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div>Loading...</div>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label>Tên Sản Phẩm *</Label>
                          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Amount type *</Label>
                          <Select value={String(form.amountType)} onValueChange={(v) => setForm({ ...form, amountType: Number(v) as 0 | 1 })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Range</SelectItem>
                              <SelectItem value="1">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {form.amountType === 0 ? (
                          <>
                            <div className="space-y-1">
                              <Label>Minimum amount *</Label>
                              <Input type="number" value={form.minimum} onChange={(e) => setForm({ ...form, minimum: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                              <Label>Maximum amount</Label>
                              <Input type="number" value={form.maximum} onChange={(e) => setForm({ ...form, maximum: Number(e.target.value) })} />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <Label>Số lượng</Label>
                            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label>Return / interest *</Label>
                          <Input type="number" value={form.interest} onChange={(e) => setForm({ ...form, interest: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Interest type</Label>
                          <Select value={form.interestStatus} onValueChange={(v: any) => setForm({ ...form, interestStatus: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Mỗi</Label>
                          <Select value={String(form.times)} onValueChange={(v) => setForm({ ...form, times: Number(v) })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">6 Month</SelectItem>
                              <SelectItem value="2">3 Month</SelectItem>
                              <SelectItem value="3">Month</SelectItem>
                              <SelectItem value="4">Week</SelectItem>
                              <SelectItem value="5">Day</SelectItem>
                              <SelectItem value="6">Hours</SelectItem>
                              <SelectItem value="7">Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Return for</Label>
                          <Select value={String(form.returnFor)} onValueChange={(v) => setForm({ ...form, returnFor: Number(v) as 0 | 1 })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Trọn đời</SelectItem>
                              <SelectItem value="1">Period</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {form.returnFor === 1 && (
                          <div className="space-y-1">
                            <Label>How many times</Label>
                            <Input type="number" value={form.repeatTime} onChange={(e) => setForm({ ...form, repeatTime: Number(e.target.value) })} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label>Hoàn vốn</Label>
                          <Select value={String(form.capitalBack)} onValueChange={(v) => setForm({ ...form, capitalBack: Number(v) as 0 | 1 })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Không</SelectItem>
                              <SelectItem value="1">Có</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>User Invest Limit</Label>
                          <Input type="number" value={form.userInvestLimit} onChange={(e) => setForm({ ...form, userInvestLimit: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Trạng thái</Label>
                          <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inactive">Disable</SelectItem>
                              <SelectItem value="active">Tích cực</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Mô tả</Label>
                        <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Tính năng (mỗi dòng)</Label>
                        <Textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-bold">Thưởng liên kết (Referral Bonus)</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const levels = [...(form.referral?.levels || [])];
                              const commissions = [...(form.referral?.commissions || [])];
                              levels.push(`F${levels.length + 1}`);
                              commissions.push(0);
                              setForm({ ...form, referral: { levels, commissions } });
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Thêm cấp
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                          {form.referral?.levels.map((level, idx) => (
                            <div key={idx} className="relative space-y-2 rounded-xl border bg-white/5 p-4 transition-all hover:bg-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-primary">{level}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    const levels = [...form.referral!.levels];
                                    const commissions = [...form.referral!.commissions];
                                    levels.splice(idx, 1);
                                    commissions.splice(idx, 1);
                                    setForm({ ...form, referral: { levels, commissions } });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase">Tỷ lệ (%)</Label>
                                <Input
                                  type="number"
                                  step={0.1}
                                  value={form.referral!.commissions[idx]}
                                  onChange={(e) => {
                                    const commissions = [...form.referral!.commissions];
                                    commissions[idx] = Number(e.target.value);
                                    setForm({ ...form, referral: { ...form.referral!, commissions } });
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Cập nhật</Button>
                        {isEdit && id && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm("Xóa sản phẩm này?")) return;
                              await deletePlan(id, tk());
                              toast({ title: "Đã xóa sản phẩm" });
                              navigate("/admin/plans");
                            }}
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
