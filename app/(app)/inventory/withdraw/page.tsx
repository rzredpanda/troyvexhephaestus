import { createClient } from "@/lib/supabase/server";
import { WithdrawForm } from "./withdraw-form";
import type { Team } from "@/lib/types";

export default async function WithdrawPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");
  return <WithdrawForm teams={(teams as Team[]) ?? []} />;
}
