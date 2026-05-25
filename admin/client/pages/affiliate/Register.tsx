import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { affiliateRegister } from "@/lib/affiliateApi";
import { setAffiliateToken, getAffiliateToken } from "@/lib/affiliateAuth";

export default function AffiliateRegister() {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [referralCode, setReferralCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const t = getAffiliateToken();
    if (t) window.location.assign("/affiliate");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await affiliateRegister({ email, username, firstName, lastName, password, referralCode });
      if (!res || !res.accessToken) {
        throw new Error("Đăng ký thất bại. Vui lòng kiểm tra email chưa tồn tại và mã giới thiệu hợp lệ.");
      }
      setAffiliateToken(res.accessToken);
      toast({ title: "Đăng ký thành công" });
      window.location.assign("/affiliate");
    } catch (e: any) {
      toast({ title: "Đăng ký thất bại", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-base">Đăng ký Affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input placeholder="Email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required />
            <Input placeholder="Tên đăng nhập" value={username} onChange={(e)=> setUsername(e.target.value)} required />
            <Input placeholder="Tên" value={firstName} onChange={(e)=> setFirstName(e.target.value)} required />
            <Input placeholder="Họ" value={lastName} onChange={(e)=> setLastName(e.target.value)} required />
            <Input placeholder="Mật khẩu" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
            <Input placeholder="Mã giới thiệu" value={referralCode} onChange={(e)=> setReferralCode(e.target.value)} required />
            <Button type="submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo tài khoản"}</Button>
            <a href="/affiliate/login" className="text-xs text-muted-foreground hover:underline text-center">Đã có tài khoản? Đăng nhập</a>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
