import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
import type { Team } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");

  let initialUsers;
  if (profile.role === "owner") {
    const { data: users } = await supabase.from("profiles").select("*, team:teams(name)").order("created_at");
    initialUsers = users ?? [];
  }

  return <SettingsForm profile={profile} teams={(teams as Team[]) ?? []} initialUsers={initialUsers} />;
}
