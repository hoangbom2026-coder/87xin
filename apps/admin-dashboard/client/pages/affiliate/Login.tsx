import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { toast } from "@game/ui/use-toast";
import { affiliateLogin, setAffiliateToken, getAffiliateToken } from "@/lib/affiliateAuth";

export default function AffiliateLogin() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const t = getAffiliateToken();
    if (t) window.location.assign("/affiliate");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await affiliateLogin(username.trim(), password);
      if (!res || !res.accessToken) {
        throw new Error("Sai thông tin đăng nhập hoặc lỗi máy chủ.");
      }
      setAffiliateToken(res.accessToken);
      toast({ title: "Đăng nhập thành công" });
      window.location.assign("/affiliate");
    } catch (e: any) {
      toast({ title: "Đăng nhập thất bại", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-base">Đăng nhập Affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input placeholder="Tên đăng nhập hoặc Email" value={username} onChange={(e)=> setUsername(e.target.value)} required />
            <Input placeholder="Mật khẩu" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
            <Button type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
            <a href="/affiliate/register" className="text-xs text-muted-foreground hover:underline text-center">Chưa có tài khoản? Đăng ký</a>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
