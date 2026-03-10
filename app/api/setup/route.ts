import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Bootstrap endpoint: creates a demo owner user only if no users exist.
// Safe to leave deployed — becomes a no-op once any user exists.
export async function POST() {
  // Check if any profiles exist
  const { count } = await adminClient
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (count && count > 0) {
    return NextResponse.json(
      { error: "Setup already complete. Use the owner account to create more users." },
      { status: 409 }
    );
  }

  const email = "demo@vex.test";
  const password = "Demo1234!";

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: "Demo Owner", role: "owner" })
    .eq("id", newUser.user!.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email, password });
}
