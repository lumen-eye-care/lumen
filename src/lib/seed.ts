/**
 * Dev seed — populates the local/staging database with realistic data so every
 * page that reads from the DB can render without manual inserts.
 *
 * Sources: docs/design/shared.jsx (FRAMES), docs/design/clinics.jsx (clinics)
 *          — converted 1-to-1 so the seed matches what the prototype renders.
 *
 * Run with:  pnpm seed
 *
 * NEVER run against production — the script bails early if NEXT_PUBLIC_SITE_URL
 * points at a production domain ("lumeneye.org" / "lumenframes.com").
 *
 * Behaviour: upserts on slug so re-running is idempotent.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/db/types";

// ---------------------------------------------------------------------------
// Guard — abort immediately on production
// ---------------------------------------------------------------------------
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
// Match on the parsed hostname, not a substring of the URL: `includes("lumeneye.org")`
// also matches https://lumeneye.org.evil.com and https://evil.com/?x=lumeneye.org
// (CodeQL js/incomplete-url-substring-sanitization).
let siteHost = "";
try {
  siteHost = new URL(siteUrl).hostname.toLowerCase();
} catch {
  siteHost = "";
}
const PROD_DOMAINS = ["lumeneye.org", "lumenframes.com"];
const isProduction = PROD_DOMAINS.some(
  (domain) => siteHost === domain || siteHost.endsWith(`.${domain}`),
);
if (isProduction) {
  console.error("SEED ABORTED: refusing to run against production.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // service-role; bypasses RLS

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. " +
      "Check your .env.local file.",
  );
  process.exit(1);
}

const db = createClient<Database>(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// 1. Frame categories  (docs/design/shop.jsx:122-133 — the three shop tabs)
// ---------------------------------------------------------------------------
const frameCategories: TablesInsert<"frame_categories">[] = [
  {
    slug: "optical",
    name: "Optical",
    sort_order: 0,
    hero_title: "Frames, considered.",
    hero_subtitle:
      "Italian acetate, Japanese titanium, Swiss lenses. Chosen for fit, longevity and design integrity.",
  },
  {
    slug: "sun",
    name: "Sunglasses",
    sort_order: 1,
    hero_title: "The sunglasses collection.",
    hero_subtitle:
      "Polarised, prescription-ready, and tuned for Ghana sun. Every pair carries our two-year frame warranty.",
  },
  {
    slug: "contacts",
    name: "Contact lenses",
    sort_order: 2,
    hero_title: "Contact lenses.",
    hero_subtitle:
      "From daily disposables to monthlies, toric and multifocal — fitted by our optometrists.",
  },
];

// ---------------------------------------------------------------------------
// 1b. Lens builder catalogue (US-P2-02 + follow-up). Global catalogue (one menu
// for all frames) and the SINGLE SOURCE OF TRUTH shared by the /lens-guide quiz
// and the PDP builder — anything the quiz recommends must exist here as a buildable
// slug. Grouped + researched (optician-grade); see
// docs/stories/US-P2-02-followup-catalogue-quiz-accordion.md.
//
// PRICES ARE PLACEHOLDERS — Charity sets the real surcharges in /admin/lenses.
// Money is integer pesewa (×100). Add-on rows set addon_group / included /
// single_select EXPLICITLY (a PostgREST bulk insert sends missing keys as NULL).
// Honesty: no "Transitions®" trademark, no blue-light eye-health/strain claims.
// ---------------------------------------------------------------------------
const lensTypes: TablesInsert<"lens_types">[] = [
  {
    slug: "single",
    name: "Single vision",
    description: "One correction for distance or reading. The most common lens.",
    price_ghs: 0,
    badge: "Most popular",
    sort_order: 0,
  },
  {
    slug: "reading",
    name: "Reading",
    description: "Tuned for close work — books, phones, fine print.",
    price_ghs: 0,
    sort_order: 1,
  },
  {
    slug: "office",
    name: "Office / computer",
    description: "Sharp from your screen to across the desk. Built for screen-heavy days.",
    price_ghs: 8000,
    badge: "For screens",
    sort_order: 2,
  },
  {
    slug: "bifocal",
    name: "Bifocal",
    description: "Distance and reading in one lens, with a visible line.",
    price_ghs: 35000,
    sort_order: 3,
  },
  {
    slug: "varifocal",
    name: "Varifocal (progressive)",
    description: "Distance, intermediate and reading blended with no visible line.",
    price_ghs: 48000,
    badge: "Recommended",
    sort_order: 4,
  },
  {
    slug: "plano",
    name: "Plano (no prescription)",
    description: "Zero-power lenses with no vision correction — for sunglasses or a blue-light pair without a prescription.",
    price_ghs: 0,
    sort_order: 5,
  },
];

const lensAddons: TablesInsert<"lens_addons">[] = [
  // ── Coatings (multi-select) ──────────────────────────────────────────────
  {
    slug: "antireflective",
    name: "Anti-reflective coating",
    description: "Cuts glare and reflections on screens and at night.",
    price_ghs: 0,
    included: true,
    addon_group: "coating",
    single_select: false,
    sort_order: 0,
  },
  {
    slug: "scratch",
    name: "Scratch-resistant coating",
    description: "A tougher surface that holds up to everyday wear.",
    price_ghs: 0,
    included: true,
    addon_group: "coating",
    single_select: false,
    sort_order: 1,
  },
  {
    slug: "uv",
    name: "UV400 protection",
    description: "Blocks UV-A and UV-B — important under the Ghana sun.",
    price_ghs: 0,
    included: true,
    addon_group: "coating",
    single_select: false,
    sort_order: 2,
  },
  {
    slug: "bluelight",
    name: "Blue-light filter",
    description:
      "A warmer tint some people prefer for long screen sessions. Current evidence doesn't show it prevents eye strain — it's a comfort choice, not a health one.",
    price_ghs: 12000,
    included: false,
    addon_group: "coating",
    single_select: false,
    sort_order: 3,
  },
  {
    slug: "antifog",
    name: "Anti-fog coating",
    description: "Keeps lenses clear moving between air-con and humid outdoor air.",
    price_ghs: 8000,
    included: false,
    addon_group: "coating",
    single_select: false,
    sort_order: 4,
  },
  // ── Sun & tint (multi-select) ────────────────────────────────────────────
  {
    slug: "photochromic",
    name: "Light-reactive (photochromic)",
    description: "Darkens in sunlight, clears indoors — one pair for both.",
    price_ghs: 32000,
    included: false,
    addon_group: "sun",
    single_select: false,
    sort_order: 5,
  },
  {
    slug: "polarised",
    name: "Polarised sun lenses",
    description: "Kills road and water glare — best for driving and bright days.",
    price_ghs: 28000,
    included: false,
    addon_group: "sun",
    single_select: false,
    sort_order: 6,
  },
  {
    slug: "tint",
    name: "Fashion tint",
    description: "A solid or gradient tint — grey, brown or rose.",
    price_ghs: 18000,
    included: false,
    addon_group: "sun",
    single_select: false,
    sort_order: 7,
  },
  // ── Lens thickness / material (single-select index) ──────────────────────
  // Pick exactly one. Higher index = thinner & lighter for stronger prescriptions.
  // Can't be auto-recommended (we don't capture Rx numbers in v1) — guidance only.
  {
    slug: "index150",
    name: "Standard 1.50",
    description: "Best value for mild prescriptions.",
    price_ghs: 0,
    included: true,
    addon_group: "thickness",
    single_select: true,
    sort_order: 8,
  },
  {
    slug: "poly159",
    name: "Polycarbonate 1.59",
    description: "Lighter and impact-resistant — good for active wear and kids.",
    price_ghs: 15000,
    included: false,
    addon_group: "thickness",
    single_select: true,
    sort_order: 9,
  },
  {
    slug: "index160",
    name: "Thin 1.60",
    description: "Noticeably thinner for moderate prescriptions.",
    price_ghs: 18000,
    included: false,
    addon_group: "thickness",
    single_select: true,
    sort_order: 10,
  },
  {
    slug: "index167",
    name: "Extra-thin 1.67",
    description: "Slim and light for strong prescriptions.",
    price_ghs: 26000,
    included: false,
    addon_group: "thickness",
    single_select: true,
    sort_order: 11,
  },
  {
    slug: "index174",
    name: "Ultra-thin 1.74",
    description: "Our thinnest lens for very strong prescriptions.",
    price_ghs: 40000,
    included: false,
    addon_group: "thickness",
    single_select: true,
    sort_order: 12,
  },
];

// ---------------------------------------------------------------------------
// 2. Clinics  (docs/design/clinics.jsx:5-51 — the hardcoded clinics array)
// opening_hours: {mon:{open,close,closed},...}
// Coordinates are approximate centroids.
// ---------------------------------------------------------------------------
const stdHours = {
  mon: { open: "08:00", close: "19:00", closed: false },
  tue: { open: "08:00", close: "19:00", closed: false },
  wed: { open: "08:00", close: "19:00", closed: false },
  thu: { open: "08:00", close: "19:00", closed: false },
  fri: { open: "08:00", close: "20:00", closed: false },
  sat: { open: "09:00", close: "18:00", closed: false },
  sun: { open: null, close: null, closed: true },
};

const clinics: TablesInsert<"clinics">[] = [
  {
    slug: "east-legon",
    name: "East Legon clinic",
    address: "12 Lagos Avenue, East Legon, Accra",
    phone: "+233302700218",
    whatsapp: "+233552138821",
    optometrist_count: 3,
    services: [
      "Eye tests",
      "Contact lens fitting",
      "Children's eye tests",
      "Glasses fitting",
    ],
    opening_hours: stdHours,
    is_flagship: true,
    latitude: 5.636,
    longitude: -0.163,
    sort_order: 0,
  },
  {
    slug: "osu",
    name: "Osu clinic",
    address: "Oxford St, Osu, Accra",
    phone: "+233302700219",
    whatsapp: "+233552138822",
    optometrist_count: 2,
    services: ["Eye tests", "Contact lens fitting", "Glasses fitting"],
    opening_hours: {
      ...stdHours,
      mon: { open: "09:00", close: "20:00", closed: false },
      tue: { open: "09:00", close: "20:00", closed: false },
      wed: { open: "09:00", close: "20:00", closed: false },
      thu: { open: "09:00", close: "20:00", closed: false },
      fri: { open: "09:00", close: "20:00", closed: false },
    },
    is_flagship: false,
    latitude: 5.554,
    longitude: -0.186,
    sort_order: 1,
  },
  {
    slug: "airport-residential",
    name: "Airport Residential",
    address: "7 Mankata Close, Airport Residential, Accra",
    phone: "+233302700220",
    whatsapp: "+233552138823",
    optometrist_count: 2,
    services: ["Eye tests", "Glasses fitting", "Designer collections"],
    opening_hours: {
      ...stdHours,
      fri: { open: "08:00", close: "18:00", closed: false },
    },
    is_flagship: false,
    latitude: 5.604,
    longitude: -0.171,
    sort_order: 2,
  },
  {
    slug: "adum-kumasi",
    name: "Adum clinic, Kumasi",
    address: "Prempeh II Street, Adum, Kumasi",
    phone: "+233322201500",
    whatsapp: "+233552138824",
    optometrist_count: 2,
    services: ["Eye tests", "Contact lens fitting", "Children's eye tests"],
    opening_hours: {
      ...stdHours,
      fri: { open: "08:00", close: "18:00", closed: false },
    },
    is_flagship: false,
    latitude: 6.69,
    longitude: -1.623,
    sort_order: 3,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("Lumen seed: starting…");

  // 1. Frame categories — needed before frames (FK)
  console.log("  › frame_categories");
  const { data: catData, error: catErr } = await db
    .from("frame_categories")
    .upsert(frameCategories, { onConflict: "slug" })
    .select("id, slug");
  if (catErr) throw new Error(`frame_categories: ${catErr.message}`);
  const catIds = Object.fromEntries((catData ?? []).map((r) => [r.slug, r.id]));

  // 1b. Lens builder catalogue — global; no FK to frames (US-P2-02).
  // The catalogue is the single source of truth for the quiz + builder, so the seed
  // is AUTHORITATIVE: upsert the current set, then delete any slug no longer in it
  // (e.g. the retired `blue` type / `transition` add-on). Safe — order_items keep a
  // jsonb lens_config snapshot, there's no FK to these rows.
  console.log("  › lens_types");
  const { error: lensTypeErr } = await db
    .from("lens_types")
    .upsert(lensTypes, { onConflict: "slug" });
  if (lensTypeErr) throw new Error(`lens_types: ${lensTypeErr.message}`);
  const { error: lensTypePruneErr } = await db
    .from("lens_types")
    .delete()
    .not("slug", "in", `(${lensTypes.map((t) => t.slug).join(",")})`);
  if (lensTypePruneErr) throw new Error(`lens_types prune: ${lensTypePruneErr.message}`);

  console.log("  › lens_addons");
  const { error: lensAddonErr } = await db
    .from("lens_addons")
    .upsert(lensAddons, { onConflict: "slug" });
  if (lensAddonErr) throw new Error(`lens_addons: ${lensAddonErr.message}`);
  const { error: lensAddonPruneErr } = await db
    .from("lens_addons")
    .delete()
    .not("slug", "in", `(${lensAddons.map((a) => a.slug).join(",")})`);
  if (lensAddonPruneErr) throw new Error(`lens_addons prune: ${lensAddonPruneErr.message}`);

  // 2. Frames  (docs/design/shared.jsx:93-102 — FRAMES array)
  // Prices converted: GHS 1 = 100 pesewa (integer pesewa in price_ghs).
  // material extracted from prototype "type" string (e.g. "Japanese Titanium · Optical").
  console.log("  › frames");
  const frames: TablesInsert<"frames">[] = [
    {
      slug: "accra",
      name: "Accra",
      shape: "round",
      material: "Italian Acetate",
      category_id: catIds["optical"],
      price_ghs: 58000,
      badge: "BESTSELLER",
      colors: [
        { name: "Midnight", hex: "#1E3148" },
        { name: "Tortoise", hex: "#8B4513" },
        { name: "Onyx", hex: "#2D2D2D" },
      ],
      gender: "men",
      stock: 20,
      materials: { frame: "Italian Acetate" },
    },
    {
      slug: "achimota",
      name: "Achimota",
      shape: "square",
      material: "Japanese Titanium",
      category_id: catIds["optical"],
      price_ghs: 85000,
      badge: null,
      colors: [
        { name: "Onyx", hex: "#2D2D2D" },
        { name: "Smoke", hex: "#5A6B7A" },
        { name: "Cocoa", hex: "#8B7355" },
      ],
      gender: "men",
      stock: 15,
      materials: { frame: "Japanese Titanium" },
    },
    {
      slug: "aburi",
      name: "Aburi",
      shape: "cateye",
      material: "Italian Acetate",
      category_id: catIds["optical"],
      price_ghs: 72000,
      badge: "NEW",
      colors: [
        { name: "Midnight", hex: "#1E3148" },
        { name: "Garnet", hex: "#7B2C36" },
        { name: "Onyx", hex: "#2D2D2D" },
      ],
      gender: "women",
      stock: 12,
      materials: { frame: "Italian Acetate" },
    },
    {
      slug: "labadi",
      name: "Labadi",
      shape: "aviator",
      material: "Metal",
      category_id: catIds["sun"],
      price_ghs: 89000,
      badge: null,
      colors: [
        { name: "Cocoa", hex: "#8B7355" },
        { name: "Onyx", hex: "#2D2D2D" },
        { name: "Sand", hex: "#C0A878" },
      ],
      gender: "unisex",
      stock: 10,
      materials: { frame: "Metal" },
    },
    {
      slug: "aya",
      name: "Aya",
      shape: "oval",
      material: "Italian Acetate",
      category_id: catIds["optical"],
      price_ghs: 49000,
      badge: null,
      colors: [
        { name: "Garnet", hex: "#7B2C36" },
        { name: "Midnight", hex: "#1E3148" },
        { name: "Onyx", hex: "#2D2D2D" },
      ],
      gender: "women",
      stock: 18,
      materials: { frame: "Italian Acetate" },
    },
    {
      slug: "bonwire",
      name: "Bonwire",
      shape: "hex",
      material: "Italian Acetate",
      category_id: catIds["optical"],
      price_ghs: 68000,
      badge: "LIMITED",
      colors: [
        { name: "Onyx", hex: "#2D2D2D" },
        { name: "Walnut", hex: "#5C4033" },
        { name: "Midnight", hex: "#1E3148" },
      ],
      gender: "unisex",
      stock: 5,
      materials: { frame: "Italian Acetate" },
    },
    {
      slug: "osu-frame",
      name: "Osu",
      shape: "round",
      material: "Metal",
      category_id: catIds["optical"],
      price_ghs: 76000,
      badge: null,
      colors: [
        { name: "Sand", hex: "#C0A878" },
        { name: "Onyx", hex: "#2D2D2D" },
        { name: "Smoke", hex: "#5A6B7A" },
      ],
      gender: "men",
      stock: 14,
      materials: { frame: "Japanese Metal" },
    },
    {
      slug: "kente",
      name: "Kente",
      shape: "cateye",
      material: "Italian Acetate",
      category_id: catIds["sun"],
      price_ghs: 62000,
      badge: null,
      colors: [
        { name: "Onyx", hex: "#2D2D2D" },
        { name: "Garnet", hex: "#7B2C36" },
        { name: "Walnut", hex: "#5C4033" },
      ],
      gender: "women",
      stock: 9,
      materials: { frame: "Italian Acetate" },
    },
  ];
  const { error: frErr } = await db
    .from("frames")
    .upsert(frames, { onConflict: "slug" });
  if (frErr) throw new Error(`frames: ${frErr.message}`);

  // 3. Clinics
  console.log("  › clinics");
  const { error: clErr } = await db
    .from("clinics")
    .upsert(clinics, { onConflict: "slug" });
  if (clErr) throw new Error(`clinics: ${clErr.message}`);

  // Journal (US-P2-03) was cut from scope — no journal seeding.
  // The journal_categories / journal_posts tables remain in the schema (harmless,
  // public-read RLS) but are intentionally left empty.

  // 4. Admin user + mock orders (US-P1-07 testability)
  await seedAdminAndOrders();

  console.log("Lumen seed: done ✓");
}

/**
 * Creates the env-driven admin user (app_metadata.role = 'admin') and a couple
 * of mock orders so /admin/orders renders. Uses the secret-key client `db`
 * (Auth admin API). Idempotent; skips cleanly if the admin env vars are unset.
 */
async function seedAdminAndOrders(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      "  › admin user — skipped (set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD to enable)",
    );
    return;
  }

  console.log("  › admin user");
  const { data: list, error: listErr } = await db.auth.admin.listUsers();
  if (listErr) throw new Error(`admin listUsers: ${listErr.message}`);
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  let adminId: string;
  if (existing) {
    const { data, error } = await db.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { role: "admin" },
    });
    if (error) throw new Error(`admin update: ${error.message}`);
    adminId = data.user.id;
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: { name: "Lumen Admin" },
    });
    if (error) throw new Error(`admin create: ${error.message}`);
    adminId = data.user.id;
  }

  // Ensure the public.users profile row exists (the handle_new_user trigger
  // covers fresh creates; upsert covers the already-existed path).
  await db
    .from("users")
    .upsert({ id: adminId, email, name: "Lumen Admin", role: "admin" }, {
      onConflict: "id",
    });

  console.log("  › mock orders");
  const { data: frameRows } = await db
    .from("frames")
    .select("id, price_ghs, slug")
    .in("slug", ["accra", "kente"]);
  const bySlug = Object.fromEntries((frameRows ?? []).map((f) => [f.slug, f]));
  const accra = bySlug["accra"];
  const kente = bySlug["kente"];
  if (!accra || !kente) {
    console.log("    (skipped — seed frames missing)");
    return;
  }

  const mockOrders = [
    {
      payment_reference: "LUMEN-TEST-0001",
      status: "paid", // fulfillable → "Mark shipped" shows
      payment_method: "momo",
      frame: accra,
      color: "Midnight",
    },
    {
      payment_reference: "LUMEN-TEST-0002",
      status: "delivered", // already fulfilled
      payment_method: "card",
      frame: kente,
      color: "Onyx",
    },
  ];

  for (const o of mockOrders) {
    const { data: order, error: oErr } = await db
      .from("orders")
      .upsert(
        {
          user_id: adminId,
          status: o.status,
          payment_method: o.payment_method,
          payment_reference: o.payment_reference,
          total_ghs: o.frame.price_ghs,
          currency: "GHS",
        },
        { onConflict: "payment_reference" },
      )
      .select("id")
      .single();
    if (oErr || !order) {
      throw new Error(`order ${o.payment_reference}: ${oErr?.message}`);
    }

    // Replace line items idempotently (no natural unique key on order_items).
    await db.from("order_items").delete().eq("order_id", order.id);
    const { error: iErr } = await db.from("order_items").insert({
      order_id: order.id,
      frame_id: o.frame.id,
      price_ghs: o.frame.price_ghs,
      quantity: 1,
      color_selected: o.color,
    });
    if (iErr) throw new Error(`order_items ${o.payment_reference}: ${iErr.message}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
