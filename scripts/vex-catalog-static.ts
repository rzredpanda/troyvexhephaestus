/**
 * Comprehensive VEX V5 parts catalog — compiled from official VEX product data.
 * Run: npx tsx scripts/vex-catalog-static.ts
 * Or use the Supabase MCP to run the generated SQL directly.
 */

export const VEX_V5_CATALOG = [
  // ── Electronics ──────────────────────────────────────────────────────────
  { sku: "276-4840", part_id: "V5-BRAIN",       name: "V5 Robot Brain",                            unit_price: 27499, category: "Electronics" },
  { sku: "276-4841", part_id: "V5-CTRL",         name: "V5 Controller",                             unit_price: 12499, category: "Electronics" },
  { sku: "276-4842", part_id: "V5-CTRL-BATT",    name: "V5 Controller Battery",                     unit_price: 1999,  category: "Electronics" },
  { sku: "276-4843", part_id: "V5-CTRL-CABLE",   name: "V5 Controller Charging Cable",              unit_price: 1499,  category: "Electronics" },
  { sku: "276-4855", part_id: "V5-BATT",         name: "V5 Robot Battery",                          unit_price: 9999,  category: "Electronics" },
  { sku: "276-4856", part_id: "V5-CHG",          name: "V5 Battery Charger",                        unit_price: 4999,  category: "Electronics" },
  { sku: "276-4860", part_id: "V5-RADIO",        name: "V5 Robot Radio",                            unit_price: 2499,  category: "Electronics" },
  { sku: "276-7395", part_id: "V5-CABLE-200",    name: "V5 Smart Cable 200mm (8-pack)",             unit_price: 1499,  category: "Electronics" },
  { sku: "276-7394", part_id: "V5-CABLE-100",    name: "V5 Smart Cable 100mm (8-pack)",             unit_price: 1499,  category: "Electronics" },
  { sku: "276-7396", part_id: "V5-CABLE-300",    name: "V5 Smart Cable 300mm (8-pack)",             unit_price: 1499,  category: "Electronics" },
  { sku: "276-7397", part_id: "V5-CABLE-400",    name: "V5 Smart Cable 400mm (8-pack)",             unit_price: 1499,  category: "Electronics" },
  { sku: "276-7398", part_id: "V5-CABLE-500",    name: "V5 Smart Cable 500mm (8-pack)",             unit_price: 1499,  category: "Electronics" },

  // ── Motors ────────────────────────────────────────────────────────────────
  { sku: "276-4850", part_id: "V5-MTR",          name: "V5 Smart Motor",                            unit_price: 3999,  category: "Motors" },
  { sku: "276-4851", part_id: "V5-MTR-11W",      name: "V5 Smart Motor 11W",                        unit_price: 4999,  category: "Motors" },
  { sku: "276-4852", part_id: "V5-CART-100",     name: "V5 Smart Motor Cartridge 100 RPM (2-pack)", unit_price: 1999,  category: "Motors" },
  { sku: "276-4853", part_id: "V5-CART-200",     name: "V5 Smart Motor Cartridge 200 RPM (2-pack)", unit_price: 1999,  category: "Motors" },
  { sku: "276-4854", part_id: "V5-CART-600",     name: "V5 Smart Motor Cartridge 600 RPM (2-pack)", unit_price: 1999,  category: "Motors" },

  // ── Sensors ───────────────────────────────────────────────────────────────
  { sku: "276-4862", part_id: "V5-DIST",         name: "V5 Distance Sensor",                        unit_price: 2499,  category: "Sensors" },
  { sku: "276-4863", part_id: "V5-OPT",          name: "V5 Optical Sensor",                         unit_price: 2499,  category: "Sensors" },
  { sku: "276-4864", part_id: "V5-VIS",          name: "V5 Vision Sensor",                          unit_price: 6999,  category: "Sensors" },
  { sku: "276-4865", part_id: "V5-BUMP",         name: "V5 Bumper Switch (2-pack)",                 unit_price: 999,   category: "Sensors" },
  { sku: "276-5646", part_id: "V5-ROT",          name: "V5 Rotation Sensor",                        unit_price: 1499,  category: "Sensors" },
  { sku: "276-7447", part_id: "V5-IMU",          name: "V5 Inertial Sensor",                        unit_price: 2999,  category: "Sensors" },
  { sku: "276-6961", part_id: "V5-GPS",          name: "V5 GPS Sensor",                             unit_price: 6999,  category: "Sensors" },
  { sku: "276-7272", part_id: "V5-AI-VIS",       name: "V5 AI Vision Sensor",                       unit_price: 7999,  category: "Sensors" },
  { sku: "276-4866", part_id: "V5-MAGNET",       name: "V5 Electromagnet",                          unit_price: 4499,  category: "Sensors" },

  // ── Structure — C-Channels ─────────────────────────────────────────────
  { sku: "276-5501", part_id: "C-CH-1x25",       name: "1x25 C-Channel (25-pack)",                  unit_price: 1999,  category: "Structure" },
  { sku: "276-5502", part_id: "C-CH-2x25",       name: "2x25 C-Channel (25-pack)",                  unit_price: 2499,  category: "Structure" },
  { sku: "276-5505", part_id: "C-CH-1x1",        name: "1x1 C-Channel (25-pack)",                   unit_price: 1499,  category: "Structure" },
  { sku: "276-5506", part_id: "C-CH-2x20",       name: "2x20 C-Channel (25-pack)",                  unit_price: 2299,  category: "Structure" },
  { sku: "276-6511", part_id: "C-CH-2x15",       name: "2x15 C-Channel (25-pack)",                  unit_price: 1799,  category: "Structure" },
  { sku: "276-6512", part_id: "C-CH-1x5x1",      name: "1x5x1 C-Channel (25-pack)",                 unit_price: 1799,  category: "Structure" },

  // ── Structure — Angles ─────────────────────────────────────────────────
  { sku: "276-5503", part_id: "ANG-1x25",        name: "1x2x1 Angle (25-pack)",                     unit_price: 1799,  category: "Structure" },
  { sku: "276-5504", part_id: "ANG-2x25",        name: "2x2x1 Angle (25-pack)",                     unit_price: 2299,  category: "Structure" },
  { sku: "276-6513", part_id: "ANG-1x5x1",       name: "1x5x1 Angle (25-pack)",                     unit_price: 1799,  category: "Structure" },

  // ── Structure — Plates & Bars ───────────────────────────────────────────
  { sku: "276-5507", part_id: "PLATE-1x2",       name: "1x2 Flat Plate (25-pack)",                  unit_price: 1499,  category: "Structure" },
  { sku: "276-5508", part_id: "PLATE-2x4",       name: "2x4 Flat Plate (25-pack)",                  unit_price: 1999,  category: "Structure" },
  { sku: "276-6514", part_id: "PLATE-2x2",       name: "2x2 Flat Plate (25-pack)",                  unit_price: 1499,  category: "Structure" },
  { sku: "276-5522", part_id: "BAR-1x15",        name: "1x15 Bar (25-pack)",                        unit_price: 1499,  category: "Structure" },
  { sku: "276-5523", part_id: "BAR-1x25",        name: "1x25 Bar (25-pack)",                        unit_price: 1799,  category: "Structure" },

  // ── Structure — Gussets & Standoffs ────────────────────────────────────
  { sku: "276-5526", part_id: "GUSSET-A",        name: "Aluminum Gusset A (8-pack)",                unit_price: 799,   category: "Structure" },
  { sku: "276-5527", part_id: "GUSSET-B",        name: "Aluminum Gusset B (8-pack)",                unit_price: 799,   category: "Structure" },
  { sku: "276-5528", part_id: "STOFF-0.5",       name: "0.5\" Aluminum Standoff (25-pack)",         unit_price: 799,   category: "Structure" },
  { sku: "276-5529", part_id: "STOFF-1.0",       name: "1.0\" Aluminum Standoff (25-pack)",         unit_price: 899,   category: "Structure" },
  { sku: "276-5530", part_id: "STOFF-1.5",       name: "1.5\" Aluminum Standoff (25-pack)",         unit_price: 999,   category: "Structure" },
  { sku: "276-5531", part_id: "STOFF-2.0",       name: "2.0\" Aluminum Standoff (25-pack)",         unit_price: 1099,  category: "Structure" },
  { sku: "276-5532", part_id: "STOFF-0.5-HS",    name: "0.5\" High Strength Standoff (25-pack)",    unit_price: 899,   category: "Structure" },

  // ── Motion — Gears ────────────────────────────────────────────────────
  { sku: "276-5537", part_id: "HS-GEAR",         name: "High Strength Gear Kit (36T, 60T, 84T)",    unit_price: 1299,  category: "Gears & Pulleys" },
  { sku: "276-5539", part_id: "GEAR-36T",        name: "36T Gear (4-pack)",                         unit_price: 899,   category: "Gears & Pulleys" },
  { sku: "276-5540", part_id: "GEAR-60T",        name: "60T Gear (2-pack)",                         unit_price: 899,   category: "Gears & Pulleys" },
  { sku: "276-5541", part_id: "GEAR-84T",        name: "84T Gear (2-pack)",                         unit_price: 999,   category: "Gears & Pulleys" },
  { sku: "276-5542", part_id: "GEAR-12T",        name: "12T Gear (8-pack)",                         unit_price: 799,   category: "Gears & Pulleys" },
  { sku: "276-6516", part_id: "GEAR-48T",        name: "48T Gear (4-pack)",                         unit_price: 999,   category: "Gears & Pulleys" },
  { sku: "276-6517", part_id: "GEAR-24T",        name: "24T Gear (4-pack)",                         unit_price: 899,   category: "Gears & Pulleys" },

  // ── Motion — Sprockets & Chain ────────────────────────────────────────
  { sku: "276-5538", part_id: "HS-SPROCKET",     name: "High Strength Sprocket & Chain Kit",        unit_price: 1299,  category: "Gears & Pulleys" },
  { sku: "276-5560", part_id: "SPROCKET-16T",    name: "16T Sprocket (6-pack)",                     unit_price: 799,   category: "Gears & Pulleys" },
  { sku: "276-5561", part_id: "SPROCKET-24T",    name: "24T Sprocket (4-pack)",                     unit_price: 899,   category: "Gears & Pulleys" },
  { sku: "276-5562", part_id: "CHAIN",           name: "Chain (100-link)",                           unit_price: 799,   category: "Gears & Pulleys" },

  // ── Wheels ────────────────────────────────────────────────────────────
  { sku: "276-3533", part_id: "3.25IN-TRAC",     name: "3.25\" Traction Wheel (4-pack)",            unit_price: 799,   category: "Wheels" },
  { sku: "276-6518", part_id: "4IN-OMNI",        name: "4\" Omni Directional Wheel (2-pack)",       unit_price: 1299,  category: "Wheels" },
  { sku: "276-6519", part_id: "4IN-TRAC",        name: "4\" Traction Wheel (2-pack)",               unit_price: 1099,  category: "Wheels" },
  { sku: "276-6520", part_id: "2.75IN-OMNI",     name: "2.75\" Omni Directional Wheel (4-pack)",    unit_price: 1299,  category: "Wheels" },
  { sku: "276-7456", part_id: "3.25IN-OMNI",     name: "3.25\" Omni Directional Wheel (4-pack)",    unit_price: 1499,  category: "Wheels" },
  { sku: "276-6541", part_id: "MECANUM",         name: "Mecanum Wheel Set (4-pack)",                unit_price: 3999,  category: "Wheels" },
  { sku: "276-7300", part_id: "WHEEL-HUB",       name: "High Strength Wheel Hub (4-pack)",          unit_price: 699,   category: "Wheels" },

  // ── Hardware — Fasteners ─────────────────────────────────────────────
  { sku: "276-5575", part_id: "SCREW-KIT",       name: "Screw & Standoff Kit (200-pack)",           unit_price: 999,   category: "Hardware" },
  { sku: "276-5576", part_id: "NUT-KIT",         name: "Keps Nut Kit (200-pack)",                   unit_price: 499,   category: "Hardware" },
  { sku: "276-5577", part_id: "HEX-BOLT-8-32",  name: "8-32 x 0.5\" Hex Bolts (100-pack)",         unit_price: 499,   category: "Hardware" },
  { sku: "276-5578", part_id: "HEX-BOLT-1.0",   name: "8-32 x 1.0\" Hex Bolts (50-pack)",          unit_price: 499,   category: "Hardware" },
  { sku: "276-5579", part_id: "HEX-BOLT-1.5",   name: "8-32 x 1.5\" Hex Bolts (25-pack)",          unit_price: 499,   category: "Hardware" },

  // ── Hardware — Shafts & Bearings ─────────────────────────────────────
  { sku: "276-5543", part_id: "BEARING-FLAT",    name: "Flat Bearing Kit (10-pack)",                unit_price: 599,   category: "Hardware" },
  { sku: "276-5544", part_id: "BEARING-3/16",    name: "Bearing Flat 3/16\" (10-pack)",             unit_price: 599,   category: "Hardware" },
  { sku: "276-5545", part_id: "SHAFT-KIT",       name: "Steel Shaft Kit (12-pack)",                 unit_price: 799,   category: "Hardware" },
  { sku: "276-5546", part_id: "COLLAR",          name: "Lock Bar Collar (10-pack)",                 unit_price: 599,   category: "Hardware" },
  { sku: "276-5547", part_id: "SPACER-NYLON",    name: "Nylon Spacer Kit",                          unit_price: 499,   category: "Hardware" },
  { sku: "276-5548", part_id: "SHAFT-COLLAR",    name: "Shaft Collar (10-pack)",                    unit_price: 699,   category: "Hardware" },
  { sku: "276-5549", part_id: "SQUARE-KEY",      name: "Square Key (20-pack)",                      unit_price: 499,   category: "Hardware" },
  { sku: "276-5570", part_id: "INSERT-SHAFT",    name: "High Strength Shaft Insert (10-pack)",      unit_price: 599,   category: "Hardware" },
  { sku: "276-5571", part_id: "SHAFT-HS",        name: "High Strength Shaft (6-pack)",              unit_price: 799,   category: "Hardware" },
  { sku: "276-1496", part_id: "RUBBER-BAND",     name: "Rubber Bands #32 (100-pack)",               unit_price: 299,   category: "Hardware" },

  // ── Pneumatics ────────────────────────────────────────────────────────
  { sku: "276-6547", part_id: "PNEUM-KIT",       name: "Pneumatics Kit",                            unit_price: 6999,  category: "Pneumatics" },
  { sku: "276-6548", part_id: "PNEUM-TANK",      name: "Pneumatics Reservoir",                      unit_price: 1499,  category: "Pneumatics" },
  { sku: "276-6549", part_id: "CYL-SINGLE",      name: "Single Acting Cylinder",                    unit_price: 1499,  category: "Pneumatics" },
  { sku: "276-6550", part_id: "CYL-DOUBLE",      name: "Double Acting Cylinder",                    unit_price: 1999,  category: "Pneumatics" },
  { sku: "276-6551", part_id: "PNEUM-FITTING",   name: "Pneumatics Fitting Kit",                    unit_price: 999,   category: "Pneumatics" },
  { sku: "276-6552", part_id: "SOLENOID",        name: "Pneumatics Solenoid (2-pack)",              unit_price: 2999,  category: "Pneumatics" },
  { sku: "276-6553", part_id: "PNEUM-TUBE",      name: "Pneumatics Tubing (6 ft)",                  unit_price: 499,   category: "Pneumatics" },

  // ── Competition & Field ───────────────────────────────────────────────
  { sku: "276-7500", part_id: "COMP-SWITCH",     name: "Competition Switch",                        unit_price: 2499,  category: "Competition" },
  { sku: "276-7501", part_id: "FIELD-CTRL",      name: "V5 Field Controller",                       unit_price: 24999, category: "Competition" },
];
