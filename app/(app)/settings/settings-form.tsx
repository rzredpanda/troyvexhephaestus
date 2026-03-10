"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { Team, Profile } from "@/lib/types";

export function SettingsForm({ profile, teams }: { profile: Profile; teams: Team[] }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [teamId, setTeamId] = useState(profile.team_id ?? "__none__");
  const [seedLoading, setSeedLoading] = useState(false);

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
    </div>
  );
}
