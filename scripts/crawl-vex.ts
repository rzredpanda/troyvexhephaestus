/**
 * VEX Robotics Product Crawler — Comprehensive Edition
 * Crawls all V5 product categories from vexrobotics.com using Playwright.
 * Handles pagination, Cloudflare bypass, JSON-LD + DOM fallback extraction.
 *
 * Run:
 *   npx tsx scripts/crawl-vex.ts          # crawl + upsert to Supabase
 *   npx tsx scripts/crawl-vex.ts --no-db  # crawl + save JSON only
 */

import { chromium, type Page } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Env ───────────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && val && !process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const NO_DB       = process.argv.includes("--no-db");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!NO_DB && (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY.startsWith("your-"))) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY missing — run with --no-db to skip DB.");
  process.exit(1);
}

const db = NO_DB ? null : createClient(SUPABASE_URL, SERVICE_KEY);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Category pages ─────────────────────────────────────────────────────────────
// Covers every meaningful V5 product section on vexrobotics.com
const CATEGORIES = [
  // Electronics & Brains
  { url: "https://www.vexrobotics.com/v5-electronics.html",           category: "Electronics" },
  { url: "https://www.vexrobotics.com/v5-brain.html",                 category: "Electronics" },
  { url: "https://www.vexrobotics.com/v5-controllers.html",           category: "Electronics" },
  { url: "https://www.vexrobotics.com/v5-batteries.html",             category: "Electronics" },
  { url: "https://www.vexrobotics.com/v5-cables.html",                category: "Electronics" },
  // Motors & Actuators
  { url: "https://www.vexrobotics.com/motors-encoders.html",          category: "Motors" },
  { url: "https://www.vexrobotics.com/v5-motors.html",                category: "Motors" },
  // Sensors
  { url: "https://www.vexrobotics.com/sensors.html",                  category: "Sensors" },
  { url: "https://www.vexrobotics.com/v5-sensors.html",               category: "Sensors" },
  // Structure
  { url: "https://www.vexrobotics.com/structure.html",                category: "Structure" },
  { url: "https://www.vexrobotics.com/c-channels.html",               category: "Structure" },
  { url: "https://www.vexrobotics.com/angles.html",                   category: "Structure" },
  { url: "https://www.vexrobotics.com/plates.html",                   category: "Structure" },
  { url: "https://www.vexrobotics.com/standoffs.html",                category: "Structure" },
  { url: "https://www.vexrobotics.com/gussets.html",                  category: "Structure" },
  { url: "https://www.vexrobotics.com/v5-structure.html",             category: "Structure" },
  // Motion — Gears, Sprockets, Shafts
  { url: "https://www.vexrobotics.com/motion.html",                   category: "Motion" },
  { url: "https://www.vexrobotics.com/gears.html",                    category: "Gears & Pulleys" },
  { url: "https://www.vexrobotics.com/sprockets-chain.html",          category: "Gears & Pulleys" },
  { url: "https://www.vexrobotics.com/pulleys-belts.html",            category: "Gears & Pulleys" },
  { url: "https://www.vexrobotics.com/shafts.html",                   category: "Hardware" },
  { url: "https://www.vexrobotics.com/shaft-collars.html",            category: "Hardware" },
  { url: "https://www.vexrobotics.com/bearings.html",                 category: "Hardware" },
  // Wheels & Traction
  { url: "https://www.vexrobotics.com/wheels.html",                   category: "Wheels" },
  { url: "https://www.vexrobotics.com/v5-wheels.html",                category: "Wheels" },
  { url: "https://www.vexrobotics.com/omni-wheels.html",              category: "Wheels" },
  { url: "https://www.vexrobotics.com/traction-wheels.html",          category: "Wheels" },
  { url: "https://www.vexrobotics.com/mecanum-wheels.html",           category: "Wheels" },
  // Hardware — Fasteners & Misc
  { url: "https://www.vexrobotics.com/hardware.html",                 category: "Hardware" },
  { url: "https://www.vexrobotics.com/screws.html",                   category: "Hardware" },
  { url: "https://www.vexrobotics.com/nuts.html",                     category: "Hardware" },
  { url: "https://www.vexrobotics.com/spacers.html",                  category: "Hardware" },
  { url: "https://www.vexrobotics.com/rubber-bands.html",             category: "Hardware" },
  // Pneumatics
  { url: "https://www.vexrobotics.com/pneumatics.html",               category: "Pneumatics" },
  { url: "https://www.vexrobotics.com/v5-pneumatics.html",            category: "Pneumatics" },
  // Competition & Field
  { url: "https://www.vexrobotics.com/v5-competition-products.html",  category: "Competition" },
  { url: "https://www.vexrobotics.com/field-control-system.html",     category: "Competition" },
  { url: "https://www.vexrobotics.com/competition-switch.html",       category: "Competition" },
  // Kits
  { url: "https://www.vexrobotics.com/v5-kits.html",                  category: "Kits" },
  { url: "https://www.vexrobotics.com/v5-starter-kits.html",          category: "Kits" },
  { url: "https://www.vexrobotics.com/v5-super-kits.html",            category: "Kits" },
  // V5RC / VIQRC Game elements (competition season parts)
  { url: "https://www.vexrobotics.com/v5rc-game-elements.html",       category: "Competition" },
  { url: "https://www.vexrobotics.com/viqrc-game-elements.html",      category: "Competition" },
];

type Product = {
  sku: string; name: string; unit_price: number;
  category: string; image_url: string | null; part_id: string | null;
};

// ── Scrape a listing page (with pagination) ────────────────────────────────────
async function scrapeListingUrls(page: Page, url: string): Promise<string[]> {
  const seen = new Set<string>();
  let current = url;

  while (true) {
    try {
      console.log(`    📄 ${current}`);
      await page.goto(current, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1200);
    } catch {
      break;
    }

    const links: string[] = await page.evaluate(() => {
      const sel = [
        "a.product-item-link",
        "a[class*='product-item']",
        ".products-grid a.product-item-link",
        ".product-item-info a",
        "ol.products li a[href*='.html']",
      ].join(",");
      return Array.from(document.querySelectorAll(sel))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => h && h.includes("vexrobotics.com") && h.endsWith(".html") && !h.includes("/category/"));
    });

    links.forEach((l) => seen.add(l));

    const next: string | null = await page.evaluate(() => {
      const el = document.querySelector("a.action.next, li.pages-item-next a, .pages .next a");
      return el ? (el as HTMLAnchorElement).href : null;
    });
    if (!next || next === current) break;
    current = next;
  }

  return [...seen];
}

// ── Scrape individual product page ────────────────────────────────────────────
async function scrapeProduct(page: Page, url: string, category: string): Promise<Product | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(600);
  } catch {
    return null;
  }

  return page.evaluate(
    ({ cat }: { cat: string }) => {
      // 1) JSON-LD
      for (const tag of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const json = JSON.parse(tag.textContent || "");
          const products = (Array.isArray(json) ? json : [json]).flatMap((d: any) =>
            d["@graph"] ? d["@graph"] : [d]
          );
          for (const p of products) {
            if (p["@type"] !== "Product") continue;
            const sku = (p.sku || p.mpn || "").toString().trim();
            if (!sku) continue;
            const priceVal = p.offers?.price ?? p.offers?.lowPrice ?? 0;
            const price = Math.round(parseFloat(String(priceVal).replace(/[^0-9.]/g, "")) * 100);
            const img = p.image
              ? Array.isArray(p.image) ? p.image[0]
                : typeof p.image === "object" ? p.image?.url
                : p.image
              : null;
            return { sku, name: (p.name || "").trim(), unit_price: price, category: cat, image_url: img || null, part_id: null };
          }
        } catch {}
      }

      // 2) DOM fallback
      const name = (
        document.querySelector("h1.page-title span, [itemprop='name'], h1.product-name")?.textContent ?? ""
      ).trim();

      const body = document.body.innerText;
      const skuM = body.match(/\b(276-\d{4,5})\b/);
      const sku = skuM?.[1] ?? "";

      const priceEl = document.querySelector(
        "[data-price-type='finalPrice'] .price, .price-wrapper .price, [itemprop='price'], .price"
      );
      const priceRaw = priceEl?.textContent ?? "0";
      const price = Math.round((parseFloat(priceRaw.replace(/[^0-9.]/g, "")) || 0) * 100);

      const imgEl = document.querySelector(
        "img.gallery-placeholder__image, img.product-image-photo, img[itemprop='image']"
      ) as HTMLImageElement | null;

      if (!sku && !name) return null;
      return { sku: sku || name, name: name || sku, unit_price: price, category: cat, image_url: imgEl?.src || null, part_id: null };
    },
    { cat: category }
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 VEX Robotics Comprehensive Product Crawler");
  console.log(`   Mode: ${NO_DB ? "JSON only (--no-db)" : "Crawl + Supabase upsert"}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"],
  });

  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
  });

  const page = await ctx.newPage();

  // Warm up
  console.log("🌐 Warming up…");
  try {
    await page.goto("https://www.vexrobotics.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);
    console.log("   ✓ Homepage loaded\n");
  } catch {
    console.warn("   ⚠ Homepage warmup failed, continuing\n");
  }

  const allProducts: Product[] = [];
  const seenUrls = new Set<string>();
  const seenSkus = new Set<string>();

  for (const { url, category } of CATEGORIES) {
    console.log(`\n📦 [${category}] ${url}`);

    let productUrls: string[];
    try {
      productUrls = await scrapeListingUrls(page, url);
    } catch (err: any) {
      console.warn(`   ⚠ Listing failed: ${err.message}`);
      continue;
    }

    const fresh = productUrls.filter((u) => !seenUrls.has(u));
    console.log(`   ${fresh.length} new URLs (${productUrls.length - fresh.length} dupes skipped)`);

    for (const pUrl of fresh) {
      seenUrls.add(pUrl);

      const product = await scrapeProduct(page, pUrl, category);

      if (!product || !product.name) {
        process.stdout.write("   ✗ ");
        console.log(pUrl.split("/").pop());
        continue;
      }

      if (seenSkus.has(product.sku)) {
        process.stdout.write("   ~ dup sku\n");
        continue;
      }
      seenSkus.add(product.sku);
      allProducts.push(product);
      console.log(`   ✓ ${product.sku.padEnd(12)} ${product.name.substring(0, 55)} ($${(product.unit_price / 100).toFixed(2)})`);

      await sleep(400);
    }
  }

  await browser.close();

  // Save JSON
  const outPath = path.join(process.cwd(), "scripts", "vex-catalog.json");
  fs.writeFileSync(outPath, JSON.stringify(allProducts, null, 2));
  console.log(`\n💾 ${allProducts.length} products → ${outPath}`);

  if (allProducts.length === 0) {
    console.error("❌ Nothing scraped — VEX may have changed their site. Try headless: false.");
    process.exit(1);
  }

  if (NO_DB) {
    console.log("⚠  --no-db: skipping Supabase upsert\n");
    return;
  }

  // Upsert to Supabase
  console.log(`\n⬆  Upserting ${allProducts.length} items to Supabase…`);
  const BATCH = 50;
  let done = 0;
  for (let i = 0; i < allProducts.length; i += BATCH) {
    const batch = allProducts.slice(i, i + BATCH);
    const { error } = await db!.from("catalog_items").upsert(batch, { onConflict: "sku" });
    if (error) console.error(`  ❌ batch ${i}: ${error.message}`);
    else { done += batch.length; console.log(`  ✓ ${done}/${allProducts.length}`); }
  }
  console.log(`\n✅ Done! ${done} items upserted.\n`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
