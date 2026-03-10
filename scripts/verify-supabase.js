// @ts-nocheck
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

async function verify() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/teams?select=id,name&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Supabase returned ${res.status}: ${text}`);
      process.exit(1);
    }

    const data = await res.json();
    console.log(`✅ Supabase connected. URL: ${SUPABASE_URL}`);
    console.log(`   teams table accessible (${data.length} row(s) returned)`);

    // Check required tables exist by querying them
    const tables = ["profiles", "catalog_items", "inventory", "inventory_logs"];
    for (const table of tables) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (!r.ok) {
        console.warn(`⚠️  Table "${table}" not accessible (status ${r.status}) — run SQL setup scripts`);
      } else {
        console.log(`   ✓ ${table}`);
      }
    }
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

verify();
