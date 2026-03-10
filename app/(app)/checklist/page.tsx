import { createClient } from "@/lib/supabase/server";
import { ChecklistClient } from "./checklist-client";

export default async function ChecklistPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checklist_items")
    .select("*")
    .order("created_at", { ascending: true });
  return <ChecklistClient initialItems={data ?? []} />;
}
