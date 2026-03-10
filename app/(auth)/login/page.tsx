"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSetupDemo() {
    setSetupLoading(true);
    const res = await fetch("/api/setup", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Setup failed");
    } else {
      setEmail(data.email);
      setPassword(data.password);
      toast.success("Demo account created — credentials filled in below");
    }
    setSetupLoading(false);
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">VEX Inventory</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First time?</p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>Click below to create a demo owner account:</p>
            <p className="font-mono bg-muted rounded px-2 py-1">demo@vex.test / Demo1234!</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSetupDemo}
            disabled={setupLoading}
          >
            {setupLoading ? "Setting up…" : "Create Demo Account"}
          </Button>
          <p className="text-xs text-muted-foreground">
            After signing in, go to <span className="font-medium">Settings → Seed Demo Data</span> to populate sample inventory.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
