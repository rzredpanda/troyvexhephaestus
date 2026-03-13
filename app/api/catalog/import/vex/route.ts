import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type CatalogItem = {
  sku: string;
  name: string;
  unit_price: number;
  category: string;
  image_url?: string;
};

// All known VEX V5 category pages
const CATEGORY_URLS = [
  { url: "https://www.vexrobotics.com/v5-electronics.html", category: "V5 Electronics" },
  { url: "https://www.vexrobotics.com/v5-structure.html", category: "V5 Structure" },
  { url: "https://www.vexrobotics.com/v5-motion.html", category: "V5 Motion" },
  { url: "https://www.vexrobotics.com/v5-sensors.html", category: "V5 Sensors" },
  { url: "https://www.vexrobotics.com/v5-pneumatics.html", category: "V5 Pneumatics" },
  { url: "https://www.vexrobotics.com/v5-competition.html", category: "V5 Competition" },
  { url: "https://www.vexrobotics.com/v5-accessories.html", category: "V5 Accessories" },
  { url: "https://www.vexrobotics.com/v5-brains.html", category: "V5 Electronics" },
  { url: "https://www.vexrobotics.com/v5-motors.html", category: "V5 Electronics" },
  { url: "https://www.vexrobotics.com/v5-batteries.html", category: "V5 Electronics" },
  { url: "https://www.vexrobotics.com/vexiq/hardware.html", category: "VEX IQ" },
  { url: "https://www.vexrobotics.com/vexiq/electronics.html", category: "VEX IQ Electronics" },
  { url: "https://www.robotmesh.com/catalog/category/view/id/145", category: "V5" },
  { url: "https://www.robotmesh.com/catalog/category/view/id/146", category: "V5 Structure" },
  { url: "https://www.robotmesh.com/catalog/category/view/id/147", category: "V5 Motion" },
  { url: "https://www.robotmesh.com/catalog/category/view/id/148", category: "V5 Electronics" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractJsonLdProducts(html: string, defaultCategory: string): CatalogItem[] {
  const items: CatalogItem[] = [];
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const match of matches) {
    try {
      const json = JSON.parse(match[1]);
      // Handle @graph arrays, plain arrays, ItemList, and single Product
      const candidates: unknown[] = Array.isArray(json)
        ? json
        : json["@graph"]
        ? json["@graph"]
        : json["@type"] === "ItemList" && Array.isArray(json.itemListElement)
        ? json.itemListElement.map((el: { item?: unknown }) => el?.item ?? el)
        : [json];

      for (const p of candidates) {
        if (!p || typeof p !== "object") continue;
        const prod = p as Record<string, unknown>;
        if (prod["@type"] !== "Product" || !prod.sku) continue;

        const offers = prod.offers as Record<string, unknown> | undefined;
        const priceRaw =
          offers?.price ??
          offers?.lowPrice ??
          (Array.isArray(offers?.offers) ? (offers.offers as Record<string, unknown>[])[0]?.price : undefined) ??
          "0";

        const imageRaw = prod.image as Record<string, unknown> | string | undefined;
        const imageUrl =
          typeof imageRaw === "string"
            ? imageRaw
            : typeof imageRaw === "object" && imageRaw
            ? String((imageRaw as Record<string, unknown>).url ?? "")
            : undefined;

        items.push({
          sku: String(prod.sku).trim(),
          name: String(prod.name ?? "Unknown").trim(),
          unit_price: Math.round(parseFloat(String(priceRaw)) * 100) || 0,
          category: String(prod.category ?? defaultCategory),
          image_url: imageUrl || undefined,
        });
      }
    } catch {
      // skip malformed JSON-LD
    }
  }
  return items;
}

function extractProductLinks(html: string, baseHostname: string): string[] {
  const links = new Set<string>();
  const hrefMatches = [...html.matchAll(/href="(https?:\/\/[^"]+\.html[^"]*)"/gi)];
  for (const m of hrefMatches) {
    try {
      const u = new URL(m[1]);
      // Only product pages from the same host (not category/tag/search pages)
      if (
        u.hostname === baseHostname &&
        u.pathname.endsWith(".html") &&
        !u.pathname.includes("/category/") &&
        !u.pathname.includes("/tag/") &&
        !u.pathname.includes("/search/") &&
        !u.pathname.includes("/customer/") &&
        !u.pathname.includes("/checkout/")
      ) {
        links.add(u.origin + u.pathname);
      }
    } catch {
      // skip
    }
  }
  return [...links];
}

async function fetchInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<CatalogItem[]>
): Promise<CatalogItem[]> {
  const results: CatalogItem[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    for (const r of batchResults) results.push(...r);
  }
  return results;
}

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
    const itemMap = new Map<string, CatalogItem>();
    const productLinks = new Set<string>();

    // 1. Fetch all category pages in parallel
    const categoryResults = await Promise.all(
      CATEGORY_URLS.map(async ({ url, category }) => {
        const html = await fetchPage(url);
        return { html, category, url };
      })
    );

    // 2. Extract products and product links from category pages
    for (const { html, category, url } of categoryResults) {
      if (!html) continue;

      const products = extractJsonLdProducts(html, category);
      for (const item of products) {
        if (item.sku && !itemMap.has(item.sku)) {
          itemMap.set(item.sku, item);
        }
      }

      try {
        const hostname = new URL(url).hostname;
        const links = extractProductLinks(html, hostname);
        for (const link of links) productLinks.add(link);
      } catch {
        // skip
      }
    }

    // 3. Fetch individual product pages (up to 300, batches of 10)
    const linksToFetch = [...productLinks].slice(0, 300);
    await fetchInBatches(linksToFetch, 10, async (url) => {
      const html = await fetchPage(url);
      if (!html) return [];
      // Guess category from URL path
      const path = new URL(url).pathname.toLowerCase();
      let cat = "V5";
      if (path.includes("electronic") || path.includes("brain") || path.includes("motor") || path.includes("battery")) cat = "V5 Electronics";
      else if (path.includes("struct") || path.includes("channel") || path.includes("angle") || path.includes("plate")) cat = "V5 Structure";
      else if (path.includes("motion") || path.includes("gear") || path.includes("wheel") || path.includes("sprocket")) cat = "V5 Motion";
      else if (path.includes("sensor")) cat = "V5 Sensors";
      else if (path.includes("pneumat")) cat = "V5 Pneumatics";
      else if (path.includes("vexiq") || path.includes("iq")) cat = "VEX IQ";

      const products = extractJsonLdProducts(html, cat);
      for (const item of products) {
        if (item.sku && !itemMap.has(item.sku)) {
          itemMap.set(item.sku, item);
        }
      }
      return products;
    });

    const items = [...itemMap.values()];

    if (items.length === 0) {
      return NextResponse.json({
        message: "No structured product data found. VEX may be blocking scraping — use CSV import instead.",
        imported: 0,
        sources_tried: CATEGORY_URLS.length,
        product_pages_tried: Math.min(productLinks.size, 300),
      });
    }

    // Upsert in batches of 100
    let upserted = 0;
    for (let i = 0; i < items.length; i += 100) {
      const batch = items.slice(i, i + 100);
      const { error } = await getAdminClient()
        .from("catalog_items")
        .upsert(batch, { onConflict: "sku", ignoreDuplicates: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      upserted += batch.length;
    }

    return NextResponse.json({
      message: "Import complete",
      imported: upserted,
      sources_tried: CATEGORY_URLS.length,
      product_pages_tried: Math.min(productLinks.size, 300),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
