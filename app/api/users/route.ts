import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
  const { data, error } = await supabase.from("profiles").select("*, team:teams(name)").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { email, full_name, role, team_id } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const admin = getAdminClient();

  // Invite the user — Supabase sends them an email with a magic link.
  // The role/team metadata is read by the handle_new_user trigger.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: full_name ?? "",
      role: role ?? "member",
      team_id: team_id || null,
    },
  });

  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });

  // The trigger creates the profile, but update it explicitly in case timing is off
  await admin.from("profiles").upsert({
    id: invited.user.id,
    email,
    full_name: full_name ?? "",
    role: role ?? "member",
    team_id: team_id || null,
  }, { onConflict: "id" });

  return NextResponse.json({ success: true, user_id: invited.user.id });
}
