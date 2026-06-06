# Lumen — Session Handoff

**For:** Any future Claude session (Cowork or Claude Code) opening this workspace cold. Also useful for the junior dev joining the team.
**Last updated:** Friday, 5 June 2026
**Read this first. Then read the linked files below.**

---

## Project state in one paragraph

Lumen Eye Care is a Ghana-based DTC eyewear brand launching its inaugural frames collection in the **2nd week of July 2026 (6–12 July)**. The founder, **Charity Adomah Sasu**, signed the proposal on 31 May 2026 and paid M1 (GHS 1,100) on 5 June 2026. We're at the start of Sprint 0 — domain registration, cloud account onboarding, Next.js scaffold, design-token port. **Build duration: 6 weeks compressed.** Two devs on the build (Bryan & Etornam), one experienced + one junior. Total budget: GHS 3,300 paid in 3 milestones, covering external technical resources only — dev labor is contributed as a personal favor.

---

## What's been decided (don't re-litigate)

- **Tech stack**: Next.js 14 App Router · TypeScript strict · Tailwind · Supabase (Postgres + Auth + Storage) · Paystack (MoMo + card + COD) · Vercel (Hobby) · Resend (free tier). All accounts in Charity's name. No SMS in v1.
- **Scope**: Full Claude Design prototype with tiered fallback. Tier 1 must ship; Tier 2 ships unless Week-5 checkpoint shows risk; Tier 3 ships only if Week-5 is green. Full enumeration in `Outputs/Lumen_Handoff_v1.docx` Section 4.
- **Schedule**: Sprint 0 = Week 1 (1–7 June), Sprint 1 = Weeks 2–3, Sprint 2 = Weeks 3–4, Week-5 = checkpoint + polish, Week-6 = launch.
- **Payment plan**: 3 × ₵1,100 milestones (M1 signed/setup, M2 Tier 1 ships to staging, M3 launch + handover). M1 received 5 June.
- **Prescription handling**: Charity insists on-platform upload WITH WhatsApp fallback. On-platform feature flag (`LUMEN_PRESCRIPTION_UPLOAD_ENABLED`) defaults to `false` until lens-fulfillment partner is named and DPC registration is complete.
- **Domain**: REGISTERED 6 June 2026 — **`lumeneye.org`** (Charity's choice; not from the original shortlist, which was `.com`/`.co`/`.eye`). Flag: `.org` is unconventional for a DTC store; needs SPF/DKIM/DMARC set up on it before Resend production email. Use `NEXT_PUBLIC_SITE_URL=https://lumeneye.org`.
- **Account ownership**: Every SaaS account in Charity's name; devs added as collaborators. GitHub repo lives in `lumen-eye-care` org. Org bootstrapped under Etornam's account 6 June; **promote Charity to Owner + remove self at handover** (Free plan, no billing transfer needed).
- **GitHub usernames**: Charity = `@chara-creator` (invite as **Owner**). Etornam = org creator. Bryan (other dev) = **pending — Bryan to send**; invite as Member + **Write** collaborator once received. 2FA required for all before/at acceptance.
- **Repo / environment strategy (decided 6 June)**: **One repo, not separate dev/staging/prod repos.** Branches: `main` = production (deploys to `lumeneye.org`, PR-only, protected); feature branches → PRs → Vercel auto-generates a preview URL per PR (this is the day-to-day review env). Add a long-lived `staging` branch mapped to `staging.lumeneye.org` as M2 ("Tier 1 ships to staging") approaches — not needed Day 1. **Database separation matters most: two Supabase projects — `lumen-prod` and `lumen-staging` (free tier allows 2). Preview/staging deploys point at `lumen-staging`; production at `lumen-prod`. Never let non-prod writes touch the prod DB.**
- **Stale prototype defaults to correct everywhere**: "Vodafone Cash" → **Telecel Cash**; "AirtelTigo Money" → **AT Money**. E-Levy disclosure on MoMo checkout. Phone formatting +233 / E.164. GhanaPostGPS optional, freeform text default, no postal codes required.

---

## What's open (and who owns each)

| Item | Owner | Resolve by |
|---|---|---|
| ~~Domain choice + registration~~ ✅ DONE 6 June — `lumeneye.org` | Charity | Resolved |
| Partner clinic list (names, addresses, hours, services, optometrist) | Charity | Was due Sun 31 May; chase if not received |
| Business registration (RGD + GRA TIN) | Charity | 3rd week of June |
| Paystack KYC + category eligibility for cards | Charity (KYC docs), dev (Day 2 category check) | Day 2 of Sprint 0 |
| DPC registration as data controller | Charity | Before public launch (5 July) |
| Lens-fulfillment partner contracted | Charity | Before public launch (5 July) |
| Privacy Policy + Terms of Service text | Charity (or asks agency to draft) | Mon 15 June |
| Brand assets (30+ frame photos, copy, About content) | Charity | Mon 8 June |
| Requirements Checklist signed and returned | Charity | Sun 7 June (was sent 31 May) |
| Kick-off call scheduled | Bryan & Etornam | Within 3 business days of M1 = by Wed 10 June |

---

## File compass

```
Clients/Lumen/
├── SESSION_HANDOFF.md            ← THIS FILE (start here)
├── brief.md                       ← client context, founder, scope (v2)
├── STATUS.md                      ← current workflow stage + approval log
├── Designs/                       ← Claude Design prototype (HTML/JSX/CSS)
├── Research/
│   ├── claude_design_README.md             ← design partner package overview
│   ├── claude_design_migration_plan.md     ← original 10-phase research scaffold
│   ├── lumen_problem_research_v1.md        ← problem framing, "why" behind scope
│   ├── lumen_open_questions_v1.md          ← Open Questions sent to Charity (answered)
│   ├── lumen_assumptions_v1.md             ← Assumptions list, confirmed by Etornam
│   ├── lumen_dev_research_brief_v1.md      ← Sprint 0 day-by-day checklist + cost links
│   ├── lumen_team_setup_guide_v1.md        ← two-dev team onboarding + Claude Code essentials
│   ├── lumen_app_flow_v1.md                ← Mermaid diagrams for every flow (incl. Tier 3)
│   ├── lumen_domain_options_v1.md          ← WHOIS check results + registrar links
│   └── lumen_sprint0_scaffold_steps_v2.md  ← step-by-step Day 1 scaffold (GitHub, Next.js, Vercel, Supabase)
└── Outputs/
    ├── Lumen_Proposal_v1.docx              ← historical
    ├── Lumen_Proposal_v2.docx              ← historical
    ├── Lumen_Proposal_v3.docx              ← SIGNED 31 May 2026 — contractual scope
    ├── Lumen_Requirements_v1.docx          ← sent to Charity, pending sign-off
    ├── Lumen_M1_Payment_Message_v1.md      ← WhatsApp note for M1 invoice
    ├── Lumen_Handoff_v1.docx               ← 32-page developer spec (the build bible)
    ├── Lumen_CLAUDE.md                     ← v1 — superseded
    └── Lumen_CLAUDE_v2.md                  ← USE THIS — adds Security rules section
```

---

## How to scaffold the project (Sprint 0 Day 1)

**Before you can use Claude Code, the repo has to exist.** The complete step-by-step is in `Research/lumen_sprint0_scaffold_steps_v2.md` — read that file first. Steps 1–6 cover: create GitHub org + repo, scaffold Next.js, drop in CLAUDE.md + docs, set branch protection, wire cloud accounts (Vercel, Supabase, Resend, Paystack), open Claude Code in the repo and confirm CLAUDE.md loads. Roughly 60–90 minutes end-to-end.

When you start a new Cowork session on the new account and want help with scaffolding, ask:

> Read `Clients/Lumen/Research/lumen_sprint0_scaffold_steps_v2.md` and walk me through Step 1 to start.

That gives the new Claude full context and a step it can guide you through.

## First-day prompts for the new Claude Code (Code tab) session

**Claude Code lives inside Claude Desktop as the "Code" tab (post-April 2026 redesign).** Not a separate terminal CLI. To start a session: open Claude Desktop → click the Code tab → `+ New session` → Local → Select folder → choose the cloned `lumen` repo. The session reads `CLAUDE.md` from the repo root automatically.

In that Code tab session:

**Prompt 1 — orientation (run first, every session):**

> Read CLAUDE.md and tell me back the project overview, tech stack, top 3 security rules, and what user stories are P0 vs P1 vs P2. I want to confirm CLAUDE.md is loading correctly.

**Prompt 2 — Sprint 0 day-by-day plan:**

> Read CLAUDE.md, then read docs/app-flow.md and docs/Lumen_Handoff_v1.docx Sections 4–7. Produce a Sprint 0 day-by-day implementation plan for Mon 1 June – Fri 7 June: list each task, the file paths it touches, what cloud account setup is required, and what blocks Charity. Don't write any code yet.

**Prompt 3 — first feature (Tailwind brand tokens):**

> Per docs/Lumen_Handoff_v1.docx Section 4 (Design Tokens), port the Lumen brand colors, typography, spacing scale, and border radii into tailwind.config.ts. Reference Designs/styles.css for exact values. Add CSS variables for the colors so they're addressable as `var(--lumen-ink)` too. Write the changes; don't commit yet.

**Prompt 4 — security rules check (before any auth or payment code):**

> Read CLAUDE.md Security rules sections 1–10. For each security rule, confirm in one line what the implementation looks like in this codebase. If anything is unclear, ask before proceeding.

---

## Suggested two-dev work split

**Experienced dev (Bryan or Etornam):**
- Auth (US-P0-04), Checkout (US-P0-05, 06, 07), Paystack webhook handler, Admin surface, Account dashboard server actions.
- The parts with most server-side logic and financial risk.

**Junior dev (the other one):**
- Home page, Shop page (US-P0-01), Frame Detail page (US-P0-02), Cart Drawer (US-P0-03), Partner Clinics directory (US-P0-09), Lens Quiz (US-P1-02), Journal index (US-P2-03 if Tier 3).
- The parts that are largely composition + content rendering — lower financial risk.

**Pair-program** the first 2–3 days so the junior absorbs the patterns. After that, divide and review each other's PRs.

---

## When in doubt

- **Product or scope question** → WhatsApp Charity (+233 24 562 8432). She is the sole decision-maker.
- **Out-of-scope creep** → check `Outputs/Lumen_Handoff_v1.docx` Section 19 (Out of Scope). If unsure, ask before building.
- **Security question or something feels off** → STOP. Ask Cowork-Claude or the experienced dev. Don't ship security shortcuts.
- **Tier 3 trigger ambiguity** at Week-5 checkpoint → review with both devs + Charity. Mechanical descope rule applies, don't re