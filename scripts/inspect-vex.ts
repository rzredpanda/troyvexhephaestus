/**
 * Debug script — takes a screenshot and dumps the HTML of a VEX category page
 * so we can find the correct product selectors.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  // Warm up
  await page.goto("https://www.vexrobotics.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);

  // Go to electronics category
  console.log("Loading electronics page...");
  await page.goto("https://www.vexrobotics.com/v5-electronics.html", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: "scripts/vex-page.png", fullPage: false });
  console.log("Screenshot saved to scripts/vex-page.png");

  // Dump relevant HTML snippets
  const info = await page.evaluate(() => {
    // Try to find any product-like elements
    const selectors = [
      ".product-item", ".product-items", ".item", "[class*='product']",
      "[class*='catalog']", "li.item", ".products", ".product-list",
      "[data-product-id]", "[itemtype*='Product']",
    ];
    const found: Record<string, number> = {};
    for (const sel of selectors) {
      const count = document.querySelectorAll(sel).length;
      if (count > 0) found[sel] = count;
    }

    // Get first 3000 chars of body HTML for analysis
    const bodyHtml = document.body.innerHTML.substring(0, 5000);

    // Check for any links with .html that look like products
    const allLinks = Array.from(document.querySelectorAll("a"))
      .map((a: HTMLAnchorElement) => ({ href: a.href, text: a.textContent?.trim().substring(0, 50) }))
      .filter((l) => l.href.includes("vexrobotics.com") && l.href.endsWith(".html") && l.text && l.text.length > 3)
      .slice(0, 30);

    // Get page title and meta
    const title = document.title;
    const h1 = document.querySelector("h1")?.textContent;

    return { found, allLinks, title, h1, bodyHtml };
  });

  console.log("\nPage title:", info.title);
  console.log("H1:", info.h1);
  console.log("\nProduct-like selectors found:", JSON.stringify(info.found, null, 2));
  console.log("\nFirst 30 .html links:");
  info.allLinks.forEach((l: any) => console.log(`  ${l.href} — "${l.text}"`));

  // Save HTML dump
  fs.writeFileSync("scripts/vex-dump.html", info.bodyHtml);
  console.log("\nHTML dump saved to scripts/vex-dump.html");

  await browser.close();
}

main().catch(console.error);
