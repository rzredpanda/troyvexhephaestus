/**
 * VEX Robotics Product Crawler
 * Uses a real Chromium browser (Playwright) to bypass Cloudflare protection.
 * Crawls vexrobotics.com for all V5 parts: name, SKU, price, category, image.
 * Upserts results directly into Supabase catalog_items.
 *
 * Run: npx tsx scripts/crawl-vex.ts
 */

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config — reads from .env.local automatically
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}
loadEnv();

const NO_DB   = process.argv.includes("--no-db");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!NO_DB && (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === "your-service-role-key-here")) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder in .env.local");
  console.error("   Get it from: https://supabase.com/dashboard/project/itresinabiskuwkpfkyz/settings/api");
  console.error("   Or run with --no-db to crawl and save to JSON only.\n");
  process.exit(1);
}

const supabase = NO_DB ? null : createClient(SUPABASE_URL, SERVICE_KEY);

// ---------------------------------------------------------------------------
// VEX V5 category pages to crawl
// ---------------------------------------------------------------------------
const CATEGORY_PAGES = [
  { url: "https://www.vexrobotics.com/v5-electronics.html",          category: "Electronics" },
  { url: "https://www.vexrobotics.com/motors-encoders.html",         category: "Motors" },
  { url: "https://www.vexrobotics.com/sensors.html",                 category: "Sensors" },
  { url: "https://www.vexrobotics.com/structure.html",               category: "Structure" },
  { url: "https://www.vexrobotics.com/motion.html",                  category: "Motion" },
  { url: "https://www.vexrobotics.com/pneumatics.html",              category: "Pneumatics" },
  { url: "https://www.vexrobotics.com/hardware.html",                category: "Hardware" },
  { url: "https://www.vexrobotics.com/wheels.html",                  category: "Wheels" },
  { url: "https://www.vexrobotics.com/v5-kits.html",                 category: "Kits" },
  { url: "https://www.vexrobotics.com/v5-competition-products.html", category: "Competition" },
];

type Product = {
  sku: string;
  name: string;
  unit_price: number;
  category: string;
  image_url: string | null;
  part_id: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Extract products from a listing page (handles pagination)
// ---------------------------------------------------------------------------
async function scrapeListingPage(page: any, url: string, category: string): Promise<string[]> {
  const productUrls: string[] = [];
  let currentUrl = url;

  while (true) {
    console.log(`  📄 Listing: ${currentUrl}`);
    await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(1500);

    // Collect all product links on this page
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll("a.product-item-link, a[class*='product-item'], .product-item-info a");
      return Array.from(anchors)
        .map((a: any) => a.href)
        .filter((href: string) => href && href.includes("vexrobotics.com") && href.endsWith(".html"));
    });
    productUrls.push(...links);
    console.log(`    Found ${links.length} products`);

    // Check for next page
    const nextUrl = await page.evaluate(() => {
      const next = document.querySelector("a.action.next, li.pages-item-next a, .next a");
      return next ? (next as HTMLAnchorElement).href : null;
    });

    if (!nextUrl || nextUrl === currentUrl) break;
    currentUrl = nextUrl;
  }

  // Deduplicate
  return [...new Set(productUrls)];
}

// ---------------------------------------------------------------------------
// Extract product details from an individual product page
// ---------------------------------------------------------------------------
async function scrapeProductPage(page: any, url: string, category: string): Promise<Product | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(800);

    const product = await page.evaluate((cat: string) => {
      // Try JSON-LD first
      const jsonLdTags = document.querySelectorAll('script[type="application/ld+json"]');
      for (const tag of jsonLdTags) {
        try {
          const data = JSON.parse(tag.textContent || "");
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item["@type"] === "Product") {
              const sku = item.sku || item.mpn || "";
              if (!sku) continue;
              const price = parseFloat(
                String(item.offers?.price || item.offers?.lowPrice || item.offers?.highPrice || "0")
              );
              const image = item.image
                ? Array.isArray(item.image)
                  ? item.image[0]
                  : typeof item.image === "object"
                  ? item.image.url
                  : item.image
                : null;
              return {
                sku: String(sku).trim(),
                name: String(item.name || "").trim(),
                unit_price: Math.round(price * 100),
                category: cat,
                image_url: image || null,
                part_id: null,
              };
            }
          }
        } catch {}
      }

      // Fallback: DOM scraping
      const name =
        document.querySelector("h1.page-title span, h1.product-name, [itemprop='name']")?.textContent?.trim() || "";

      // SKU: look for text like "276-XXXX" anywhere on page
      const bodyText = document.body.innerText;
      const skuMatch = bodyText.match(/\b(276-\d{4,5})\b/);
      const sku = skuMatch ? skuMatch[1] : "";

      const priceText =
        document.querySelector("[data-price-type='finalPrice'] .price, .price-wrapper .price, [itemprop='price']")
          ?.textContent || "0";
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

      const image =
        (document.querySelector("img.gallery-placeholder__image, img.product-image-photo") as HTMLImageElement)
          ?.src || null;

      if (!sku || !name) return null;

      return {
        sku,
        name,
        unit_price: Math.round(price * 100),
        category: cat,
        image_url: image,
        part_id: null,
      };
    }, category);

    return product;
  } catch (err: any) {
    console.warn(`    ⚠ Failed ${url}: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🚀 VEX Robotics Product Crawler");
  console.log("   Using Chromium to bypass Cloudflare...\n");

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });

  // Stealth: remove navigator.webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  // Warm up with homepage first so Cloudflare issues a cookie
  console.log("🌐 Warming up with VEX homepage...");
  try {
    await page.goto("https://www.vexrobotics.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2000);
    console.log("   ✓ Homepage loaded\n");
  } catch {
    console.warn("   ⚠ Homepage load failed, proceeding anyway\n");
  }

  const allProducts: Product[] = [];
  const seen = new Set<string>();

  for (const { url, category } of CATEGORY_PAGES) {
    console.log(`\n📦 Category: ${category}`);

    let productUrls: string[] = [];
    try {
      productUrls = await scrapeListingPage(page, url, category);
    } catch (err: any) {
      console.warn(`  ⚠ Listing page failed: ${err.message}`);
      continue;
    }

    console.log(`  Total product URLs: ${productUrls.length}`);

    for (const productUrl of productUrls) {
      if (seen.has(productUrl)) continue;
      seen.add(productUrl);

      const product = await scrapeProductPage(page, productUrl, category);
      if (product && product.sku && product.name) {
        allProducts.push(product);
        console.log(`    ✓ ${product.sku.padEnd(12)} ${product.name.substring(0, 50)} ($${(product.unit_price / 100).toFixed(2)})`);
      } else {
        console.log(`    ✗ ${productUrl.split("/").pop()} — no data extracted`);
      }
      await sleep(500);
    }
  }

  await browser.close();

  // ---------------------------------------------------------------------------
  // Save JSON backup
  // ---------------------------------------------------------------------------
  const outputPath = path.join(process.cwd(), "scripts", "vex-catalog.json");
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
  console.log(`\n💾 Saved ${allProducts.length} products to ${outputPath}`);

  if (allProducts.length === 0) {
    console.error("\n❌ No products scraped. VEX may have changed their site structure.");
    console.log("   Try running with headless: false to debug visually.");
    process.exit(1);
  }

  if (NO_DB) {
    console.log(`\n⚠  --no-db flag set — skipping Supabase upsert.`);
    console.log(`   To import, add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run without --no-db.\n`);
    return;
  }

  // ---------------------------------------------------------------------------
  // Upsert to Supabase
  // ---------------------------------------------------------------------------
  console.log(`\n⬆  Upserting to Supabase...`);

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < allProducts.length; i += BATCH) {
    const batch = allProducts.slice(i, i + BATCH);
    const { error } = await supabase!
      .from("catalog_items")
      .upsert(batch, { onConflict: "sku", ignoreDuplicates: false });

    if (error) {
      console.error(`  ❌ Batch ${i}–${i + BATCH} failed: ${error.message}`);
    } else {
      inserted += batch.length;
      console.log(`  ✓ Batch ${i}–${i + batch.length} (${inserted}/${allProducts.length})`);
    }
  }

  console.log(`\n✅ Done! ${inserted} catalog items upserted to Supabase.\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
