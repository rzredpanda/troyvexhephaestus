"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { Team } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ full_name: string; email: string; role: string; team_id: string | null } | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fullName, setFullName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((p) => {
      setProfile(p);
      setFullName(p.full_name ?? "");
      setTeamId(p.team_id ?? "");
    }).catch(() => {});
    fetch("/api/teams").then((r) => r.json()).then(setTeams).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, team_id: teamId }),
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

  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

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
                  <SelectItem value="">No team</SelectItem>
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
            <Button
              variant="outline"
              onClick={handleSeedDemo}
              disabled={seedLoading}
            >
              {seedLoading ? "Seeding…" : "Seed Demo Data"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
