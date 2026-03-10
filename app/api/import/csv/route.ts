import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "owner"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Admin or owner required" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const commit = formData.get("commit") === "true";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 1_000_000) return NextResponse.json({ error: "File too large (max 1MB)" }, { status: 400 });

  const text = await file.text();
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim());
  if (rawLines.length < 2) return NextResponse.json({ error: "File must have a header row and at least one data row" }, { status: 400 });

  const headers = rawLines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const errors: { row: number; message: string }[] = [];
  const rows: { sku: string; name: string; unit_price: number }[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const vals = rawLines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });

    const rowErrors: string[] = [];
    if (!row.sku) rowErrors.push("Missing SKU");
    if (!row.name) rowErrors.push("Missing name");
    const price = parseFloat(row.unit_price ?? row.price ?? "0");
    if (isNaN(price)) rowErrors.push("Invalid unit_price");

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, message: rowErrors.join("; ") });
    } else {
      rows.push({ sku: row.sku, name: row.name, unit_price: Math.round(price * 100) });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors, preview: null, committed: false });
  }

  if (!commit) {
    return NextResponse.json({ preview: rows, errors: [], committed: false });
  }

  // Commit
  const { error } = await getAdminClient()
    .from("catalog_items")
    .upsert(rows, { onConflict: "sku", ignoreDuplicates: false });

  if (error) return NextResponse.json({ error: error.message, committed: false }, { status: 500 });
  return NextResponse.json({ committed: true, imported: rows.length, errors: [] });
}
