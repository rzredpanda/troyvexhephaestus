import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const CATALOG_ITEMS = [
  { sku: "276-4840", part_id: "V5-BRAIN", name: "V5 Robot Brain", unit_price: 27499, category: "Electronics" },
  { sku: "276-4841", part_id: "V5-CTRL", name: "V5 Controller", unit_price: 12499, category: "Electronics" },
  { sku: "276-4850", part_id: "V5-MTR", name: "V5 Smart Motor", unit_price: 3999, category: "Motors" },
  { sku: "276-4851", part_id: "V5-MTR-11W", name: "V5 Smart Motor 11W", unit_price: 4999, category: "Motors" },
  { sku: "276-4855", part_id: "V5-BATT", name: "V5 Robot Battery", unit_price: 9999, category: "Electronics" },
  { sku: "276-4856", part_id: "V5-CHG", name: "V5 Battery Charger", unit_price: 4999, category: "Electronics" },
  { sku: "276-5537", part_id: "HS-GEAR", name: "High Strength Gear Kit (36T, 60T, 84T)", unit_price: 1299, category: "Gears & Pulleys" },
  { sku: "276-5538", part_id: "HS-SPROCKET", name: "High Strength Sprocket & Chain Kit", unit_price: 1299, category: "Gears & Pulleys" },
  { sku: "276-5501", part_id: "C-CHANNEL-1x25", name: "1x25 C-Channel (25-pack)", unit_price: 1999, category: "Structure" },
  { sku: "276-5502", part_id: "C-CHANNEL-2x25", name: "2x25 C-Channel (25-pack)", unit_price: 2499, category: "Structure" },
  { sku: "276-5503", part_id: "ANGLE-1x25", name: "1x2x1 Angle (25-pack)", unit_price: 1799, category: "Structure" },
  { sku: "276-6518", part_id: "4IN-OMNI", name: "4\" Omni Directional Wheel (2-pack)", unit_price: 1299, category: "Wheels" },
  { sku: "276-3533", part_id: "3.25IN-WHEEL", name: "3.25\" Traction Wheel (4-pack)", unit_price: 799, category: "Wheels" },
  { sku: "276-6519", part_id: "4IN-TRACTION", name: "4\" Traction Wheel (2-pack)", unit_price: 1099, category: "Wheels" },
  { sku: "276-4855", part_id: "RUBBER-BAND", name: "Rubber Bands (#32, 100-pack)", unit_price: 299, category: "Hardware" },
  { sku: "276-5575", part_id: "SCREW-KIT", name: "Screw & Standoff Kit (200-pack)", unit_price: 999, category: "Hardware" },
  { sku: "276-5576", part_id: "NUT-KIT", name: "Keps Nut Kit (200-pack)", unit_price: 499, category: "Hardware" },
  { sku: "276-5543", part_id: "BEARING-FLAT", name: "Flat Bearing Kit (10-pack)", unit_price: 599, category: "Hardware" },
  { sku: "276-5545", part_id: "SHAFT-KIT", name: "Steel Shaft Kit (12-pack)", unit_price: 799, category: "Structure" },
  { sku: "276-7447", part_id: "INERTIAL", name: "V5 Inertial Sensor", unit_price: 2999, category: "Sensors" },
  { sku: "276-5646", part_id: "ROTATION", name: "V5 Rotation Sensor", unit_price: 1499, category: "Sensors" },
  { sku: "276-4862", part_id: "DISTANCE", name: "V5 Distance Sensor", unit_price: 2499, category: "Sensors" },
  { sku: "276-4863", part_id: "OPTICAL", name: "V5 Optical Sensor", unit_price: 2499, category: "Sensors" },
  { sku: "276-6547", part_id: "PNEUM-KIT", name: "Pneumatics Kit", unit_price: 6999, category: "Pneumatics" },
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  // Upsert catalog items
  const { error: catalogError } = await adminClient
    .from("catalog_items")
    .upsert(CATALOG_ITEMS, { onConflict: "sku" });
  if (catalogError) return NextResponse.json({ error: catalogError.message }, { status: 500 });

  // Fetch inserted catalog items and active teams
  const [{ data: items }, { data: teams }] = await Promise.all([
    adminClient.from("catalog_items").select("id, sku, unit_price"),
    adminClient.from("teams").select("id, name").eq("archived", false).order("name"),
  ]);

  if (!items || !teams || teams.length === 0) {
    return NextResponse.json({ success: true, message: "Catalog seeded. No teams found for inventory." });
  }

  // Seed inventory: every team gets some items with varied quantities
  const inventoryRows = [];
  const quantities: Record<string, number[]> = {
    "V5 Robot Brain":            [2, 1, 2, 1, 2, 1, 2],
    "V5 Controller":             [3, 2, 3, 2, 3, 2, 3],
    "V5 Smart Motor":            [12, 8, 10, 6, 12, 8, 10],
    "V5 Smart Motor 11W":        [4, 2, 4, 2, 4, 2, 4],
    "V5 Robot Battery":          [4, 3, 4, 3, 4, 3, 4],
    "V5 Battery Charger":        [2, 1, 2, 1, 2, 1, 2],
    "High Strength Gear Kit (36T, 60T, 84T)": [5, 3, 5, 3, 5, 3, 5],
    "High Strength Sprocket & Chain Kit":      [3, 2, 3, 2, 3, 2, 3],
    "1x25 C-Channel (25-pack)":  [8, 5, 8, 5, 8, 5, 8],
    "2x25 C-Channel (25-pack)":  [6, 4, 6, 4, 6, 4, 6],
    "1x2x1 Angle (25-pack)":     [10, 6, 10, 6, 10, 6, 10],
    "4\" Omni Directional Wheel (2-pack)": [4, 2, 4, 2, 4, 2, 4],
    "3.25\" Traction Wheel (4-pack)":      [6, 4, 6, 4, 6, 4, 6],
    "4\" Traction Wheel (2-pack)":         [3, 1, 3, 1, 3, 1, 3],
    "Rubber Bands (#32, 100-pack)":        [5, 3, 5, 3, 5, 3, 5],
    "Screw & Standoff Kit (200-pack)":     [4, 2, 4, 2, 4, 2, 4],
    "Keps Nut Kit (200-pack)":             [6, 3, 6, 3, 6, 3, 6],
    "Flat Bearing Kit (10-pack)":          [4, 2, 4, 2, 4, 2, 4],
    "Steel Shaft Kit (12-pack)":           [5, 3, 5, 3, 5, 3, 5],
    "V5 Inertial Sensor":        [2, 1, 2, 1, 2, 1, 2],
    "V5 Rotation Sensor":        [3, 2, 3, 2, 3, 2, 3],
    "V5 Distance Sensor":        [2, 1, 2, 1, 2, 1, 2],
    "V5 Optical Sensor":         [2, 1, 2, 1, 2, 1, 2],
    "Pneumatics Kit":            [1, 0, 1, 0, 1, 0, 1],
  };

  const { data: allCatalog } = await adminClient.from("catalog_items").select("id, name");
  const catalogByName = Object.fromEntries((allCatalog ?? []).map((c: { id: string; name: string }) => [c.name, c.id]));

  for (let t = 0; t < teams.length; t++) {
    const team = teams[t];
    for (const [name, qtys] of Object.entries(quantities)) {
      const catalogId = catalogByName[name];
      if (!catalogId) continue;
      const qty = qtys[t % qtys.length] ?? 0;
      inventoryRows.push({
        team_id: team.id,
        catalog_item_id: catalogId,
        quantity: qty,
        threshold: qty <= 2 ? 3 : 5,
        room: t % 2 === 0 ? "Workshop A" : "Workshop B",
      });
    }
  }

  const { error: invError } = await adminClient
    .from("inventory")
    .upsert(inventoryRows, { onConflict: "team_id,catalog_item_id" });
  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 });

  // Seed wanted items for first two teams
  const motorId = catalogByName["V5 Smart Motor"];
  const brainId = catalogByName["V5 Robot Brain"];
  const pneumId = catalogByName["Pneumatics Kit"];

  const wantedRows = [];
  if (teams[0] && motorId) {
    wantedRows.push({ team_id: teams[0].id, catalog_item_id: motorId, quantity_needed: 4, priority: "high", note: "Needed for tower bot" });
  }
  if (teams[0] && pneumId) {
    wantedRows.push({ team_id: teams[0].id, catalog_item_id: pneumId, quantity_needed: 2, priority: "medium", note: "For worlds build" });
  }
  if (teams[1] && brainId) {
    wantedRows.push({ team_id: teams[1].id, catalog_item_id: brainId, quantity_needed: 1, priority: "high", note: "Spare brain" });
  }

  if (wantedRows.length > 0) {
    await adminClient.from("wanted_items").upsert(wantedRows, { ignoreDuplicates: true });
  }

  // Seed checklist items
  const checklistRows = [
    { team_id: teams[0]?.id ?? null, label: "Pack V5 Brain + cable", checked: true, event_name: "State Championship" },
    { team_id: teams[0]?.id ?? null, label: "Charge all batteries", checked: true, event_name: "State Championship" },
    { team_id: teams[0]?.id ?? null, label: "Spare motors (4)", checked: false, event_name: "State Championship" },
    { team_id: teams[0]?.id ?? null, label: "Laptop + VEXcode", checked: false, event_name: "State Championship" },
    { team_id: teams[0]?.id ?? null, label: "Screwdrivers & hex keys", checked: false, event_name: "State Championship" },
    { team_id: null, label: "Team registration submitted", checked: true, event_name: "State Championship" },
    { team_id: null, label: "Hotel reservations confirmed", checked: false, event_name: "State Championship" },
  ];

  await adminClient.from("checklist_items").upsert(checklistRows, { ignoreDuplicates: true });

  // Seed BOM for first team
  if (teams[0]) {
    const bomRows = [
      motorId && { team_id: teams[0].id, catalog_item_id: motorId, quantity_needed: 8, bom_name: "Tower Bot 2025" },
      brainId && { team_id: teams[0].id, catalog_item_id: brainId, quantity_needed: 1, bom_name: "Tower Bot 2025" },
      catalogByName["V5 Controller"] && { team_id: teams[0].id, catalog_item_id: catalogByName["V5 Controller"], quantity_needed: 2, bom_name: "Tower Bot 2025" },
      catalogByName["V5 Inertial Sensor"] && { team_id: teams[0].id, catalog_item_id: catalogByName["V5 Inertial Sensor"], quantity_needed: 1, bom_name: "Tower Bot 2025" },
      catalogByName["V5 Rotation Sensor"] && { team_id: teams[0].id, catalog_item_id: catalogByName["V5 Rotation Sensor"], quantity_needed: 2, bom_name: "Tower Bot 2025" },
      catalogByName["4\" Omni Directional Wheel (2-pack)"] && { team_id: teams[0].id, catalog_item_id: catalogByName["4\" Omni Directional Wheel (2-pack)"], quantity_needed: 2, bom_name: "Tower Bot 2025" },
    ].filter(Boolean);

    if (bomRows.length > 0) {
      await adminClient.from("bom_items").upsert(bomRows as typeof bomRows, { ignoreDuplicates: true });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${CATALOG_ITEMS.length} catalog items, inventory for ${teams.length} teams, wanted items, checklist, and BOM.`,
  });
}
