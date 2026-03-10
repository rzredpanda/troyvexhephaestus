import { createClient } from "@/lib/supabase/server";
import { ReturnForm } from "./return-form";
import type { Team } from "@/lib/types";

export default async function ReturnPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");
  return <ReturnForm teams={(teams as Team[]) ?? []} />;
}
