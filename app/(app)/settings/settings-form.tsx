"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Team, Profile } from "@/lib/types";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  team_id: string | null;
  team?: { name: string } | null;
};

export function SettingsForm({
  profile,
  teams,
  initialUsers,
}: {
  profile: Profile;
  teams: Team[];
  initialUsers?: UserProfile[];
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [teamId, setTeamId] = useState(profile.team_id ?? "__none__");
  const [seedLoading, setSeedLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers ?? []);
  const [userForm, setUserForm] = useState({ email: "", password: "", full_name: "", role: "member", team_id: "__none__" });
  const [userLoading, setUserLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, team_id: teamId === "__none__" ? "" : teamId }),
    });
    if (res.ok) toast.success("Settings saved");
    else toast.error("Failed to save");
  }

  async function handleSeedDemo() {
    setSeedLoading(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Seed failed");
    else toast.success(data.message ?? "Demo data seeded");
    setSeedLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    const payload = { ...userForm, team_id: userForm.team_id === "__none__" ? "" : userForm.team_id };
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Failed to create user");
    else {
      toast.success("User created");
      setUserForm({ email: "", password: "", full_name: "", role: "member", team_id: "__none__" });
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
    setUserLoading(false);
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    if (!res.ok) { toast.error("Failed to update role"); return; }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    toast.success("Role updated");
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    else toast.error("Failed to delete");
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-heading text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile.role} disabled className="bg-muted capitalize" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {profile.role === "owner" && (
        <Card>
          <CardHeader>
            <CardTitle>Demo Data</CardTitle>
            <CardDescription>
              Populate the system with sample VEX V5 catalog items, inventory across all teams, wanted items, checklists, and a BOM. Safe to run multiple times (upserts).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSeedDemo} disabled={seedLoading}>
              {seedLoading ? "Seeding…" : "Seed Demo Data"}
            </Button>
          </CardContent>
        </Card>
      )}

      {profile.role === "owner" && (
        <>
          <Card>
            <CardHeader><CardTitle>Invite User</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={userForm.full_name} onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={userForm.role} onValueChange={(v) => setUserForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["member", "admin", "owner"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team (optional)</Label>
                  <Select value={userForm.team_id} onValueChange={(v) => setUserForm((f) => ({ ...f, team_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No team</SelectItem>
                      {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={userLoading}>{userLoading ? "Creating…" : "Create User"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-sm">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.team?.name ?? "No team"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["member", "admin", "owner"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
