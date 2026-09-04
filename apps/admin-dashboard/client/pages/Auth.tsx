import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Auth() {
  const navigate = useNavigate();
  const { login, token, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) navigate("/dashboard", { replace: true });
  }, [loading, token, navigate]);

  return (
    <div className="dark min-h-screen grid place-items-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (submitting) return;
              setError(null);
              setSubmitting(true);
              try {
                await login(username.trim(), password);
                toast({ title: "Logged in as admin" });
                navigate("/dashboard");
              } catch (e: any) {
                toast({ title: "Admin login failed", description: e?.message || "", variant: "destructive" });
                setError(e?.message || "Admin login failed");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm">Username</label>
              <Input name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <Input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button disabled={submitting} type="submit" className="w-full">
              {submitting ? <Loader2 className="animate-spin" /> : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
