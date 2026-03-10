import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
import type { Team } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");
  return <SettingsForm profile={profile} teams={(teams as Team[]) ?? []} />;
}
