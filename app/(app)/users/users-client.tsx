"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Team } from "@/lib/types";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  team_id: string | null;
  team?: { name: string } | null;
};

export function UsersClient({ initialUsers, teams }: { initialUsers: UserProfile[]; teams: Team[] }) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "member", team_id: "" });
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Failed to create user");
    else {
      toast.success("User created");
      setForm({ email: "", password: "", full_name: "", role: "member", team_id: "" });
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
    setLoading(false);
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    if (!res.ok) { toast.error("Failed to update role"); return; }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    toast.success("Role updated");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    else toast.error("Failed to delete");
  }

  const roleColor: Record<string, "default" | "outline" | "secondary"> = {
    owner: "default",
    admin: "secondary",
    member: "outline",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Users</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Invite User</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["member","admin","owner"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team (optional)</Label>
              <Select value={form.team_id} onValueChange={(v) => setForm((f) => ({ ...f, team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create User"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="card-elevated divide-y">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-sm">{u.full_name || u.email}</p>
              <p className="text-xs text-muted-foreground">{u.email} · {u.team?.name ?? "No team"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["member","admin","owner"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
