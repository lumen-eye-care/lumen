# US-P2-02 follow-up — Comprehensive catalogue + dynamic quiz + accordion builder

**Status: SHIPPED (2026-06-19).** Built across phases A–F; migration applied to staging,
catalogue reseeded, and the quiz → "Build this" → builder-prefill flow live-verified. See
the 2026-06-19 entry in `docs/PROGRESS.md`. Deviations from this spec: add-on `group` column
named `addon_group` (reserved word); added a `plano` (non-prescription) lens type (drops the
Rx requirement in the builder); blue-light kept buildable but **dropped from the quiz** (the
honest, evidence-led call) — heavy-screen users get an office lens + a 20-20-20 note. Lens
prices are placeholders pending Charity.

## Why

Three problems with the shipped version:

1. **Quiz ⟂ builder mismatch.** The `/lens-guide` quiz (`src/lib/lens-quiz.ts`) and the
   builder use **separate taxonomies** — the quiz can recommend a lens/add-on that doesn't
   exist as a buildable option. No single source of truth.
2. **Thin, ungrounded catalogue.** The seed lens set was a small hardcoded list, not
   researched. Real opticians offer more, organised into groups.
3. **Builder UX** is all-expanded/stacked vs the design's guided accordion
   (`docs/design/frame-detail.jsx` + `docs/design/pages.css` `.builder-step`).

**Fix (agreed, both options maxed):** make **one DB catalogue the single source of truth** —
both the quiz and the builder read it, so anything the quiz recommends is always buildable.
Expand the catalogue to an optician-grade **grouped** set (incl. lens thickness/material as a
single-select index group). Rebuild the quiz to be **dynamic + research-informed + auditable**
(rule-based, NOT an LLM — clinical-adjacent guidance must be explainable). Refactor the
builder into the design's **accordion + sticky bar**, keeping our advantages (DB-driven,
server re-priced, accessible) and the **honest stance** (no fabricated reviews / MoMo
installments / per-colour stock / unverified warranty claims).

**Research basis** (web-searched 2026-06-17): lens types = single / reading / office /
bifocal / varifocal; coatings = AR, scratch, UV (usually included), blue-light, anti-fog;
sun = photochromic, polarised, tint; material/index = 1.50→1.74 single-select by Rx strength.
Index can't be auto-recommended (we don't capture Rx numbers in v1) → it's a builder choice
with guidance, not a quiz output.

## Comprehensive catalogue (seed; all admin-editable — prices are placeholders for Charity)

**`lens_types`** (single-select): `single` (Single vision · 0 · "Most popular") · `reading`
(0) · `office` (Office/computer · +₵80 · "For screens") · `bifocal` (+₵350) · `varifocal`
(Varifocal/progressive · +₵480 · "Recommended").

**`lens_addons`** gain `group` + `single_select`:
- group **`coating`** (multi): `antireflective`(0, included) · `scratch`(0, included) ·
  `uv`(0, included) · `bluelight`(+₵120) · `antifog`(+₵80).
- group **`sun`** (multi): `photochromic`(Light-reactive · +₵320) · `polarised`(+₵280) ·
  `tint`(Fashion tint · +₵180).
- group **`thickness`** (`single_select=true`): `index150`(Standard 1.50 · 0 · included
  default) · `poly159`(Polycarbonate 1.59 · +₵150) · `index160`(Thin 1.60 · +₵180) ·
  `index167`(Extra-thin 1.67 · +₵260) · `index174`(Ultra-thin 1.74 · +₵400).

## Plan (phased — checkpoint after each)

### A. Catalogue depth — schema + seed
- Migration `20260617000002_lens_groups.sql`: `alter table public.lens_addons add column
  "group" text not null default 'coating'` + `add column single_select boolean not null
  default false` (+ optional CHECK on group values). Additive, RLS unchanged. (`group` is a
  reserved word — quote it or name the column `addon_group`.)
- Reseed `src/lib/seed.ts` `lensTypes` + `lensAddons` to the comprehensive grouped set above
  (every add-on row sets `group`, `included`, `single_select` explicitly — PostgREST bulk
  insert sends missing keys as NULL, the gotcha already hit in the base build).
- `db push` (pause for explicit go-ahead — shared staging) → `pnpm exec supabase gen types
  typescript --linked > src/db/types.ts` (use `pnpm exec`, not the script, to avoid the
  banner-in-file bug) → `pnpm seed`.

### B. Pricing + catalogue views
- `src/lib/lens-catalogue.ts` `LensAddonView` gains `group` + `singleSelect`;
  `src/server/lenses.ts` selects them.
- `src/lib/checkout-pricing.ts` `PriceableAddon` gains `group` + `single_select`;
  `priceLines()` rejects a line that selects **>1 from the same single-select group**
  (stale/tamper guard). `src/server/checkout.ts` `repriceCart()` selects the new columns.
  Extend `checkout-pricing.test.ts` (single-select violation rejected; grouped sums).

### C. Dynamic, researched quiz — single source of truth
- Rewrite `src/lib/lens-quiz.ts`: `recommendLens(answers, catalogue)` (pure; catalogue
  passed in) → `{ lensTypeSlug, addonSlugs[], reasons, notes }` referencing **only slugs
  present in the catalogue**. Rules: presbyopia (age≥40 / current varifocal|readers) or
  "both" → `varifocal` (fallback `bifocal`); reading → `reading`; screens → `office`
  (fallback `single`); else `single`. Always `antireflective`; high screen → `bluelight`;
  often outdoor → `photochromic` (+ note suggesting `polarised`). Thickness → a **note**
  ("ask about thinner lenses for a strong prescription"), never auto-selected. Keep per-line
  "why". Refresh the 5 questions' copy per research. Rewrite `lens-quiz.test.ts` for the
  slug-output engine.
- `src/app/(marketing)/lens-guide/` becomes catalogue-aware: server-load `getLensCatalogue()`,
  pass to the client quiz. Result screen shows the reasoned recommendation + a **"Build this
  on a frame"** CTA that persists `{ lensTypeSlug, addonSlugs }` to `localStorage`
  (`lumen.lensquiz.v1`) and links to `/shop`.

### D. Builder — accordion + grouped add-ons + sticky bar + prefill
`src/components/organisms/frame-purchase-panel.tsx`:
- **Accordion** (`AccordionStep`): steps Colour → Lens type → Add-ons → Prescription; one
  open at a time; numbered badge → ✓ done (sage) / active (ink); collapsed **summary** line;
  chevron; real `<button>` header w/ `aria-expanded` + `aria-controls`; body `hidden` when
  collapsed; reduced-motion-safe transition; **auto-advance** on select.
- **Grouped add-ons step:** render `lens_addons` by `group` — **Coatings** (checkboxes,
  included locked-on) · **Sun & tint** (checkboxes) · **Lens thickness** (radio, single-select,
  default the `included` index). Drives `lensUnitPesewa` (`src/lib/lens-catalogue.ts`).
- **Sticky total + CTA bar** (`.pdp-bag` analog): lens-inclusive running total + gated
  Add-to-bag; bottom padding so it never covers content; mobile-first.
- **"Book an eye test"** link in the Rx step → `/book`.
- **Quiz prefill:** mount effect reads `lumen.lensquiz.v1`, pre-selects lens type + add-ons
  (slugs match the catalogue 1:1 now — no brittle mapping), shows a dismissible "Recommended
  from your quiz" note. Defensive: only set slugs present in the loaded catalogue; SSR-safe
  (effect + hydration guard, like the cart).
- Keep the frame-only fallback when the catalogue is empty.

### E. Admin
`src/app/admin/lenses/lens-form.tsx` add-on form gains a **Group** select (`coating`/`sun`/
`thickness`) + a **Single-select group** checkbox; `src/lib/lens-schemas.ts`
`lensAddonSchema` gains `group` (enum) + `single_select` (bool); `actions.ts`
`buildLensAddonRow` writes them; list page shows the group column.

### F. Verify
`pnpm typecheck` · `lint` · `test` (quiz + pricing) · `build`. Preview on staging: take the
rebuilt quiz → recommendation references real catalogue options → "Build this" → PDP opens
with **prefill** + note; accordion (one-open, summaries, auto-advance, ✓, keyboard,
reduced-motion); thickness radio enforces single-select; sticky total tracks the build;
add-to-bag persists the full lens line; COD checkout writes `lens_price_ghs`/`lens_config`.
Admin: add a grouped add-on → appears in the right builder group. Light + dark.

## Honesty (explicitly NOT added)
No reviews/ratings, MoMo installment copy, per-colour fake stock, or unverified
warranty/guarantee strip.
