import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

export async function requireRole(minRole: Role) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const hierarchy: Role[] = ["member", "admin", "owner"];
  if (hierarchy.indexOf(profile.role) < hierarchy.indexOf(minRole)) {
    redirect("/");
  }
  return profile;
}
