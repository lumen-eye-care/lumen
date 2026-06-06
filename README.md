# Lumen Eye Care — v1 Launch Website

Ghana-based DTC eyewear brand. This repo is the v1 launch site. Single founder client (Charity Adomah Sasu); two-developer build (Bryan & Etornam). Target launch: **2nd week of July 2026 (6–12 July)**.

> **New here? Read [`CLAUDE.md`](./CLAUDE.md) first** — it's the project bible (stack, conventions, security rules). The current build state and next steps live in [`docs/PROGRESS.md`](./docs/PROGRESS.md).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 (CSS-first `@theme`) · Supabase (Postgres + Auth + Storage) · Paystack (MoMo + card) · Vercel · Resend.

**Runtime:** Node.js 20.9.0+ (CI runs Node 22). Package manager: **pnpm**.

## Getting started

```bash
# 1. Prerequisites: Node 20.9+, pnpm, Git installed
node --version
pnpm --version

# 2. Clone and install
git clone https://github.com/lumen-eye-care/lumen.git
cd lumen
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill .env.local with real values (see "Secrets" below) — never commit it

# 4. Run
pnpm dev            # http://localhost:3000
```

## Common commands

```bash
pnpm dev            # local dev server on :3000
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint .
pnpm test           # vitest run
pnpm test:e2e       # playwright test
pnpm seed           # populate dev DB with mock frames + clinics
```

## Secrets & access

Secrets are **never committed**. `.env.example` lists the variables you need; get the real values by being added to the project's cloud dashboards (each in Charity's account):

- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Paystack** — `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`
- **Resend** — `RESEND_API_KEY`

Ask Etornam to add you as a collaborator on GitHub (org `lumen-eye-care`), Vercel, Supabase, Resend, and Paystack.

## Workflow

- Work on a branch (`feature/...`, `fix/...`, `chore/...`), open a PR, get **1 approval**, merge. `main` is protected — no direct pushes.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- After a merge, `git pull` on `main` to sync your local copy.
- Don't merge with failing tests or Lighthouse below threshold (CI enforces).

## Key references

- [`CLAUDE.md`](./CLAUDE.md) — project bible: conventions + 10 security rules (read before any auth/payment work).
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — living dev log: current state, next steps.
- [`docs/Lumen_Handoff_v1.docx`](./docs/Lumen_Handoff_v1.docx) — full spec (the build bible).
- [`docs/design/`](./docs/design/) — the prototype: HTML mockups, JSX components, and `styles.css` brand tokens. Stay faithful to it.
- [`docs/app-flow.md`](./docs/app-flow.md) — flow diagrams for every user journey.
- [`docs/lumen_team_setup_guide_v1.md`](./docs/lumen_team_setup_guide_v1.md) — two-dev onboarding + Claude Code essentials.

## Working with Claude Code

Open the repo in a Code session — `CLAUDE.md` and `docs/PROGRESS.md` load automatically. Recommended setup: `/model opusplan` at `high` effort (Opus plans, Sonnet executes); bump to `xhigh`/`max` only for security-critical modules (auth, checkout, Paystack, RLS).
