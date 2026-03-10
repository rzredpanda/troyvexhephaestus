import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requireRole("owner");
  const supabase = await createClient();
  const [usersRes, teamsRes] = await Promise.all([
    supabase.from("profiles").select("*, team:teams(name)").order("created_at"),
    supabase.from("teams").select("*").order("name"),
  ]);
  return <UsersClient initialUsers={usersRes.data ?? []} teams={teamsRes.data ?? []} />;
}
