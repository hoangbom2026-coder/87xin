import * as React from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { createRootAffiliateAdmin } from "@/lib/api";

export default function CreateRootAffiliate() {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [referral, setReferral] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getAdminToken() || "";
      const res = await createRootAffiliateAdmin({ email, username, firstName, lastName, password }, token);
      setReferral(res?.affiliate?.referralCode || "");
      toast({ title: "Root affiliate created" });
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Create Root Affiliate</h1>
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">New Root Affiliate</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Input placeholder="Email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required />
              <Input placeholder="Username" value={username} onChange={(e)=> setUsername(e.target.value)} required />
              <Input placeholder="First Name" value={firstName} onChange={(e)=> setFirstName(e.target.value)} required />
              <Input placeholder="Last Name" value={lastName} onChange={(e)=> setLastName(e.target.value)} required />
              <Input placeholder="Password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
              <div className="sm:col-span-2 md:col-span-3 flex justify-end">
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
              </div>
            </form>
            {referral ? (
              <div className="mt-4 text-sm">
                <div className="text-muted-foreground">Referral Code</div>
                <div className="font-mono break-all">{referral}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
