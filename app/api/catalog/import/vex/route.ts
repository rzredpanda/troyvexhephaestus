import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  try {
    // Fetch from VEX Robotics public product sitemap / structured catalog
    // Using robotmesh.com VEX V5 category pages that expose JSON-LD
    const CATALOG_URLS = [
      "https://www.robotmesh.com/catalog/category/view/id/145",  // VEX V5
      "https://www.vexrobotics.com/v5-electronics.html",
    ];

    const items: { sku: string; name: string; unit_price: number; category: string }[] = [];

    for (const url of CATALOG_URLS) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "VEX-Inventory-Bot/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const html = await res.text();

        // Extract JSON-LD Product structured data
        const jsonLdMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
        for (const match of jsonLdMatches) {
          try {
            const json = JSON.parse(match[1]);
            const products = Array.isArray(json) ? json : [json];
            for (const p of products) {
              if (p["@type"] === "Product" && p.sku) {
                items.push({
                  sku: String(p.sku),
                  name: String(p.name ?? "Unknown"),
                  unit_price: Math.round(parseFloat(String(p.offers?.price ?? p.offers?.lowPrice ?? "0")) * 100),
                  category: "V5",
                });
              }
            }
          } catch {
            // skip malformed JSON-LD blocks
          }
        }
      } catch {
        // skip failed URL
      }
    }

    if (items.length === 0) {
      return NextResponse.json({
        message: "No structured product data found in catalog sources. Run manual CSV import instead.",
        imported: 0,
      });
    }

    const { error } = await adminClient
      .from("catalog_items")
      .upsert(items, { onConflict: "sku", ignoreDuplicates: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Import complete", imported: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
