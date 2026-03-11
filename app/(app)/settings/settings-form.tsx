"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, User, Users, Palette, Shield, AlertTriangle } from "lucide-react";
import type { Team, Profile } from "@/lib/types";

type UserProfile = {
  id: string; email: string; full_name: string; role: string;
  team_id: string | null; team?: { name: string } | null;
};

type Section = "account" | "appearance" | "users" | "danger";

function SectionNav({ active, onChange, isOwner }: { active: Section; onChange: (s: Section) => void; isOwner: boolean }) {
  const items: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    ...(isOwner ? [
      { id: "users" as Section, label: "Team Members", icon: Users },
      { id: "danger" as Section, label: "System", icon: Shield },
    ] : []),
  ];
  return (
    <nav className="w-44 flex-shrink-0">
      <ul className="space-y-0.5">
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors text-left ${
                active === id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0 w-64">{children}</div>
    </div>
  );
}

export function SettingsForm({ profile, teams, initialUsers }: {
  profile: Profile; teams: Team[]; initialUsers?: UserProfile[];
}) {
  const [section, setSection] = useState<Section>("account");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [teamId, setTeamId] = useState(profile.team_id ?? "__none__");
  const [savingProfile, setSavingProfile] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers ?? []);
  const [userForm, setUserForm] = useState({ email: "", full_name: "", role: "member", team_id: "__none__" });
  const [userLoading, setUserLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, team_id: teamId === "__none__" ? "" : teamId }),
    });
    if (res.ok) toast.success("Profile saved");
    else toast.error("Failed to save");
    setSavingProfile(false);
  }

  async function handleSeed() {
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
    if (!res.ok) toast.error(data.error ?? "Failed");
    else {
      toast.success("User created");
      setUserForm({ email: "", full_name: "", role: "member", team_id: "__none__" });
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
    setUserLoading(false);
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    if (!res.ok) { toast.error("Failed"); return; }
    setUsers((p) => p.map((u) => u.id === id ? { ...u, role } : u));
    toast.success("Role updated");
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((p) => p.filter((u) => u.id !== id));
    else toast.error("Failed to delete");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, team, and system preferences.</p>
      </div>

      <div className="flex gap-10">
        <SectionNav active={section} onChange={setSection} isOwner={profile.role === "owner"} />

        <div className="flex-1 min-w-0">
          {/* ── Account ── */}
          {section === "account" && (
            <div className="rounded-md border bg-card" style={{ boxShadow: "var(--shadow-xs)" }}>
              <div className="px-6 py-4 border-b">
                <h2 className="text-sm font-semibold">Account</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your personal profile and team assignment.</p>
              </div>
              <form onSubmit={handleSave}>
                <div className="px-6 divide-y">
                  <SettingRow title="Email" description="Your login email address — cannot be changed.">
                    <Input value={profile.email} disabled className="bg-muted text-muted-foreground" />
                  </SettingRow>
                  <SettingRow title="Role" description="Your permission level in this system.">
                    <Input value={profile.role} disabled className="bg-muted text-muted-foreground capitalize" />
                  </SettingRow>
                  <SettingRow title="Full Name" description="Your display name shown in logs and the top bar.">
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </SettingRow>
                  <SettingRow title="Team" description="Your primary team assignment for inventory operations.">
                    <Select value={teamId} onValueChange={setTeamId}>
                      <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No team</SelectItem>
                        {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </div>
                <div className="px-6 py-4 border-t bg-muted/20 flex justify-end">
                  <Button type="submit" size="sm" disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Appearance ── */}
          {section === "appearance" && (
            <div className="rounded-md border bg-card" style={{ boxShadow: "var(--shadow-xs)" }}>
              <div className="px-6 py-4 border-b">
                <h2 className="text-sm font-semibold">Appearance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Customize how the interface looks for you.</p>
              </div>
              <div className="px-6 divide-y">
                <SettingRow title="Theme" description="Choose between light and dark mode.">
                  <div className="flex gap-2">
                    {["light","dark","system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => { document.documentElement.classList.toggle("dark", t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)); }}
                        className="flex-1 py-2 px-3 rounded border text-xs font-medium capitalize transition-colors hover:bg-muted"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow title="Table density" description="Adjust how compact the data tables appear.">
                  <Select defaultValue="default">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </div>
              <div className="px-6 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                Theme and density preferences are stored in your browser.
              </div>
            </div>
          )}

          {/* ── Users (owner only) ── */}
          {section === "users" && profile.role === "owner" && (
            <div className="space-y-4">
              {/* Invite form */}
              <div className="rounded-md border bg-card" style={{ boxShadow: "var(--shadow-xs)" }}>
                <div className="px-6 py-4 border-b">
                  <h2 className="text-sm font-semibold">Invite Team Member</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">They'll receive an email invitation and sign in with Google SSO.</p>
                </div>
                <form onSubmit={handleCreateUser} className="px-6 divide-y">
                  <SettingRow title="Email" description="Invitation email will be sent here.">
                    <Input type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} required placeholder="member@team.com" />
                  </SettingRow>
                  <SettingRow title="Full Name">
                    <Input value={userForm.full_name} onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Jane Smith" />
                  </SettingRow>
                  <SettingRow title="Role">
                    <Select value={userForm.role} onValueChange={(v) => setUserForm((f) => ({ ...f, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["member","admin","owner"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow title="Team">
                    <Select value={userForm.team_id} onValueChange={(v) => setUserForm((f) => ({ ...f, team_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No team</SelectItem>
                        {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <div className="py-4 flex justify-end">
                    <Button type="submit" size="sm" disabled={userLoading}>{userLoading ? "Creating…" : "Create user"}</Button>
                  </div>
                </form>
              </div>

              {/* User list */}
              <div className="rounded-md border bg-card" style={{ boxShadow: "var(--shadow-xs)" }}>
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">All Members</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="divide-y">
                  {users.length === 0 && (
                    <p className="px-6 py-8 text-sm text-muted-foreground text-center">No users yet.</p>
                  )}
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-6 py-3 gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email} · {u.team?.name ?? "No team"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["member","admin","owner"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── System (owner only) ── */}
          {section === "danger" && profile.role === "owner" && (
            <div className="space-y-4">
              <div className="rounded-md border bg-card" style={{ boxShadow: "var(--shadow-xs)" }}>
                <div className="px-6 py-4 border-b">
                  <h2 className="text-sm font-semibold">Demo Data</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Seed the database with sample VEX V5 inventory data for testing. Safe to run multiple times.</p>
                </div>
                <div className="px-6 py-5">
                  <Button variant="outline" size="sm" onClick={handleSeed} disabled={seedLoading}>
                    {seedLoading ? "Seeding…" : "Seed demo data"}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border border-destructive/30 bg-card" style={{ boxShadow: "var(--shadow-xs)" }}>
                <div className="px-6 py-4 border-b border-destructive/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">These actions are irreversible. Proceed with caution.</p>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Clear all inventory logs</p>
                      <p className="text-xs text-muted-foreground">Permanently deletes all withdrawal, trade, and return history.</p>
                    </div>
                    <Button variant="destructive" size="sm" disabled>Clear logs</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Reset inventory counts</p>
                      <p className="text-xs text-muted-foreground">Sets all team inventory quantities to zero.</p>
                    </div>
                    <Button variant="destructive" size="sm" disabled>Reset counts</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
