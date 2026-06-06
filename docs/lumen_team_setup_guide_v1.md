# Lumen Eye Care — Team Setup & Learning Guide v1

**Goal:** Get both devs productive on the Lumen build by Mon 1 June 2026 using Claude Code, Cowork, MCP servers, and a clean GitHub workflow. This is a *living doc* — update it as the team learns what works.
---

## 0. TL;DR — installs and accounts checklist

Each dev's machine needs:

- **Node.js 20+** and **pnpm** (`npm i -g pnpm`).
- **Git** (configured with `user.name` and `user.email`).
- **GitHub account** (free is fine; add 2FA — required if you push to a repo with branch protection).
- **VS Code** (or Cursor / WebStorm — whatever the experienced dev prefers; junior dev follows the same).
- **Claude Code CLI** — installed via `npm i -g @anthropic-ai/claude-code` (or via the Claude Code installer per the [official docs](https://docs.claude.com/en/docs/claude-code)).
- **Cowork** desktop app (the tool we're using right now to plan the build — useful for project mgmt + research alongside Claude Code's coding work).
- **Chrome or Firefox** with the project staging URL bookmarked once it exists.

Shared cloud accounts (created in **Charity's name**, each dev added as collaborator):

- GitHub repo (`lumen-eye-care`, private).
- Vercel project (Hobby).
- Supabase project (free tier).
- Resend account (free tier).
- Paystack merchant account.
- Domain registrar (whichever Charity chooses for `.com.gh` / `.gh` / `.com`).

---

## 1. Sharing one Claude Pro account — reality check

**If you share one Pro account — practical rules**

- Don't use it concurrently. Two devs chatting at the same time means rate limits and conversation pollution. Coordinate via WhatsApp ("I'm on it for the next hour") or just split by time of day.
- Use **separate browser profiles or separate chat conversations** — never mix Charity-facing planning conversations with build-debugging conversations.
- Claude Code reads `CLAUDE.md` locally on each dev's machine, so Claude Code sessions are properly isolated per machine. The shared part is the underlying Claude Pro subscription and the conversation history on claude.ai.
- **Don't share API keys**. If you generate an API key on the shared account, both devs can use it but usage is metered against the same account — easy to overrun.

---

## 2. Claude Code in 2026 — the five-layer architecture

[Claude Code](https://code.claude.com/) is Anthropic's terminal-based coding agent. It runs in your project's directory, reads files, writes files, runs commands, and follows the rules in your `CLAUDE.md`. As of 2026 it has five extension layers worth knowing — covered below in order of "what the junior dev needs to know first."

### 2.1 CLAUDE.md (you already have this for Lumen)

A markdown file in the repo root that Claude Code reads automatically every session. Sets project rules, code conventions, do/don't lists, gotchas. You already have `Outputs/Lumen_CLAUDE.md` — **copy it into the repo root as `CLAUDE.md` on Day 1.** Edit it as you learn things; commit changes like any other code.

Anything in `CLAUDE.md` shapes every Claude Code response in this repo. If Claude is doing something wrong consistently, the fix is usually adding a rule to `CLAUDE.md`, not nagging Claude.

### 2.2 Skills

Skills are self-contained workflows Claude can invoke. Each skill is a folder at `.claude/skills/<n>/SKILL.md` with frontmatter (name, description, optional tools allowlist) plus a markdown body explaining what it does. Claude auto-discovers them and loads only the relevant ones for the current task. ([Claude Code Setup 2026 — MCP, Hooks, Skills](https://okhlopkov.com/claude-code-setup-mcp-hooks-skills-2026/), [Awesome Claude Skills](https://github.com/GetBindu/awesome-claude-code-and-skills))

Useful skills already on Etornam's Cowork install (and likely worth replicating on the dev's Claude Code via the plugin marketplace):

- `frontend-design` — for visual judgment on UI components.
- `engineering:code-review` — second pass on PRs before they merge.
- `engineering:debug` — structured debugging when something works in dev but not staging.
- `engineering:testing-strategy` — planning what to test in Playwright and Vitest.
- `engineering:documentation` — writing READMEs, runbooks.
- `design:accessibility-review` — WCAG audit on screens before launch.
- `design:design-handoff` — useful for translating prototype JSX into spec sheets.

You don't need to install everything. Start with `engineering:code-review`, `engineering:debug`, `frontend-design`, `design:accessibility-review` — that's enough for the build.

Browse community skills at [Best Claude Code Skills to Try in 2026](https://www.firecrawl.dev/blog/best-claude-code-skills) and the [Awesome Claude Code repo](https://github.com/GetBindu/awesome-claude-code-and-skills).

### 2.3 MCP servers (Model Context Protocol)

MCP servers give Claude Code the ability to **do things outside the chat** — query a database, post to GitHub, deploy to Vercel. Skills are knowledge; MCP is action.

You install MCP servers per-project (or globally) and configure them in a JSON file. Once installed, Claude Code can call them when relevant.

**Recommended MCP servers for the Lumen build:**

- **[Supabase MCP](https://github.com/supabase-community/supabase-mcp)** — inspect schema, run queries, check RLS policies from inside Claude Code. Highly recommended. Install in Sprint 0.
- **[GitHub MCP](https://github.com/github/github-mcp-server)** — manage issues, PRs, branches from inside Claude Code. Useful when you want Claude to do `gh pr create` for you and write the description.
- **[Next.js DevTools MCP (vercel/next-devtools-mcp)](https://github.com/vercel/next-devtools-mcp)** — Next.js-specific tooling. Useful for App Router work.
- **Vercel MCP** — check deploys, build status, preview environments. ([overview](https://data4ai.com/blog/tool-comparisons/best-mcp-servers-for-developers/))
- **Filesystem MCP** (built-in) — Claude Code already has file read/write access via the standard tools.

**Security warning worth knowing**: 30+ CVEs were filed against MCP servers in January–February 2026 alone; a scan of popular servers found findings in 66%. ([source](https://data4ai.com/blog/tool-comparisons/best-mcp-servers-for-developers/)) Practical guidance: **only install MCP servers from trusted publishers** (Anthropic, the official Supabase/GitHub/Vercel orgs, well-known community devs). Pin versions in your config. Re-evaluate before each major project.

### 2.4 Hooks

Hooks are scripts that fire on Claude Code events — `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, etc. ([Claude Code Best Practices 2026](https://mcp.directory/blog/claude-code-best-practices)) Useful for enforcing project rules automatically:

- Run `pnpm typecheck` before any commit (block commits that don't pass).
- Reject any file write touching `prisma/migrations/` without a confirmation prompt.
- Run secret-scan on every save.
- Auto-format on every save.

Hooks are an *advanced* feature — don't reach for them in week 1. Once the team has built one or two features and you can see what mistakes recur, then add hooks to prevent them. Aim to add the first hook in Sprint 2 at earliest.

### 2.5 Sub-agents

A sub-agent is a separate Claude session with its own context window, launched via the `Task` tool. Use it when you want **parallel work or context isolation** — e.g., one sub-agent researches the Paystack docs while another writes the checkout component. ([Claude Code Sub-agents docs](https://code.claude.com/docs/en/sub-agents), [2026 Playbook](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026))

For a two-dev favor build, sub-agents are also an advanced feature. The default solo Claude Code workflow gets you 80% of the way. Save sub-agents for the moment you find yourself wanting to do two things at once.

### 2.6 Plugins (the canonical way to share extensions)

A **plugin** bundles one or more skills, sub-agents, slash commands, hooks, output styles, and MCP server definitions into one installable unit. Anthropic and the community ship many on the [plugin marketplace](https://docs.claude.com/en/docs/claude-code). If you build something useful in this project, you can package it as a plugin and reuse it on future Lumen-style projects.

---

## 3. Cowork vs Claude Code — when to use which

Cowork (what we're using right now) is the desktop chat app with file tools and a sandboxed shell. Claude Code is the terminal CLI that runs in your project directory. They overlap. Use them differently:

| Task | Tool |
|---|---|
| Brainstorming, planning, drafting non-code documents (proposals, briefs, requirements) | Cowork |
| Researching libraries / approaches before coding | Cowork |
| Producing client-facing docx/pdf/pptx | Cowork (uses the office skills) |
| Working in the repo: writing code, running tests, fixing bugs, refactoring | Claude Code |
| PR descriptions, commit messages | Claude Code |
| Database migrations + schema work | Claude Code (with Supabase MCP) |
| Reading large parts of a codebase | Claude Code |
| Drawing diagrams, mockups | Cowork (with visualize widget tool) |
| Reading and responding to a client's WhatsApp/email | Cowork |

Quick rule: **if it touches code, Claude Code. If it touches docs/clients/research, Cowork.**

---

## 4. GitHub workflow for a two-person team

The goal: both devs can work on different parts of the codebase, merge cleanly, ship to staging continuously, and roll out to production confidently.

### 4.1 Initial repo setup (one-time, done by experienced dev on Day 1)

```bash
# in Charity's GitHub account (or a Lumen-Eye-Care org), create a private repo
# locally:
pnpm create next-app lumen --typescript --eslint --app --tailwind --src-dir
cd lumen
git init
git remote add origin git@github.com:charity-or-org/lumen.git
git add . && git commit -m "chore: initial Next.js scaffold"
git push -u origin main
```

Add both devs as **collaborators with Write access** in repo Settings → Collaborators. Charity is **Admin** so credentials transfer cleanly at handover. ([GitHub branch protection docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule))

### 4.2 Branch protection rules (set on `main`)

Go to Settings → Branches → Add rule for `main`:

- Require a pull request before merging.
- Require approvals: **1** (the other dev). ([Required reviewer rule is now GA — Feb 2026](https://github.blog/changelog/2026-02-17-required-reviewer-rule-is-now-generally-available/))
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging: select your CI checks (typecheck, lint, tests).
- Require branches to be up to date before merging.
- Do NOT allow force pushes to `main`.
- Allow admins to bypass (Charity only, in case of emergency rollback).

This means: nobody pushes to `main` directly. Every change goes through a PR that the other dev reviews.

### 4.3 Daily branch + PR workflow

For each user story (e.g., US-P0-04 sign up and sign in):

```bash
# 1. Make sure main is fresh
git checkout main && git pull

# 2. Create a feature branch
git checkout -b feature/us-p0-04-signup

# 3. Work, commit often (Conventional Commits)
git add .
git commit -m "feat(auth): add sign-up form with email + password validation"

# 4. Push the branch
git push -u origin feature/us-p0-04-signup

# 5. Open a PR on GitHub
#    Title: feat: sign up and sign in (US-P0-04)
#    Description: link the user story, what changed, what to test
```

The other dev reviews on GitHub: leaves comments, requests changes, or approves. Once approved + CI green, the author **squash merges** into `main` (clean history). Vercel auto-deploys the merged commit to production.

### 4.4 Pull request review etiquette (for the junior dev specifically)

Reviewing as the junior:
- It's fine — and useful — to ask "why this approach over X?" Don't just rubber-stamp. Review is a learning opportunity.
- Use GitHub's suggestion feature for small fixes (typos, naming) so the author can accept with one click.
- If you don't understand something, comment "I don't follow this — can you explain?" That's a feature, not a bug.

Being reviewed as the junior:
- Don't take feedback personally. Pushback is about the code, not you.
- Push fixes as new commits on the same branch; don't force-push (it messes up the diff).
- Once the reviewer approves, you (the author) merge — not them.

### 4.5 Merge conflicts (the first scary thing for a junior dev)

A conflict happens when both branches modified the same lines. Resolution:

```bash
# On your feature branch:
git fetch origin
git rebase origin/main      # or: git merge origin/main if you prefer

# If conflicts, git tells you which files. Open each, look for:
#   <<<<<<< HEAD
#   ...your code...
#   =======
#   ...their code...
#   >>>>>>> origin/main
# Decide what to keep (often both, integrated). Remove the markers.

git add <conflicted-files>
git rebase --continue       # or: git commit if you merged

git push --force-with-lease  # only if you rebased (rewrites your branch history)
```

`--force-with-lease` is the safer force-push: it refuses to overwrite if someone else has pushed to the branch since you last fetched. Always use it instead of `--force`.

VS Code has a built-in merge editor that's very junior-friendly. Use it.

### 4.6 GitHub Actions for CI (set up Day 1)

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

This runs on every PR. If any step fails, the PR cannot be merged. Both devs add a `pnpm test` Lighthouse check by Sprint 2 to catch performance regressions.

### 4.7 Splitting work between two devs

For Lumen, page-based splitting works well because the prototype is structured per-page:

- **Dev A :** Auth, Checkout, Paystack integration, Admin, Account dashboard (the parts with most server logic / financial risk).
- **Dev B  :** Home, Shop, Frame Detail, Lens Quiz, Partner Clinics, Journal (the parts that are largely component composition + content rendering).

Keep a **shared "in-progress" comment** in the GitHub Project board (or pinned WhatsApp message) so neither dev accidentally starts the same thing. Pair-program the first 2-3 days so the dev absorbs the patterns the experienced dev uses.

---

## 5. Junior dev learning paths by topic

Each path is a 1–3 day learning block. Do them in order. Skip topics the junior dev already knows.

### 5.1 Git & GitHub fundamentals (1–2 days)

If the junior has never used Git in a team setting:

- **[GitHub Skills (free, interactive)](https://skills.github.com)** — start with "Introduction to GitHub" and "Review pull requests".
- **[Pro Git book (free, online)](https://git-scm.com/book/en/v2)** — chapters 1–3 cover everything you need for daily work.
- **[Learn Git Branching (visual, free)](https://learngitbranching.js.org/)** — interactive tutorial that shows you what's happening when you branch / merge / rebase.

### 5.2 TypeScript essentials (1 day)

- **[TypeScript Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)** — the only TypeScript reading you need before starting.
- **[Total TypeScript Beginner's Tutorial (free)](https://www.totaltypescript.com/tutorials/beginners-typescript)** — Matt Pocock; widely recommended.
- Daily rule: when in doubt, write the type. `any` is forbidden in this repo.

### 5.3 React (2 days, if new to React)

- **[React Foundations from Next.js Learn (free)](https://nextjs.org/learn/react-foundations)** — the official intro that flows directly into Next.js.
- **[React Beta Docs](https://react.dev/learn)** — comprehensive and well-written.
- Concepts to master before Sprint 1: components, props, state with `useState`, effects with `useEffect`, conditional rendering, lists & keys, controlled forms.

### 5.4 Next.js App Router (2–3 days)

- **[Next.js Foundations course (free, official, ~6 hours)](https://nextjs.org/learn/dashboard-app)** — the canonical resource. Builds a financial dashboard with auth, db, streaming. Maps almost 1:1 to what we're building. ([referenced as the best Next.js course in 2026](https://dev.to/ottoaria/nextjs-app-router-in-2026-the-complete-guide-for-full-stack-developers-5bjl))
- **[Next.js App Router docs (start at "Getting Started")](https://nextjs.org/docs/app/getting-started)** — bookmark; reference, not cover-to-cover.
- 2026 context: **App Router is now stable and the recommended path**; Pages Router is in maintenance mode. Don't start with the Pages Router tutorials by accident.

### 5.5 Tailwind CSS (half a day)

- **[Tailwind docs — Getting Started](https://tailwindcss.com/docs/installation)** — install + utility-first concept.
- **[Tailwind Play](https://play.tailwindcss.com)** — sandbox for experimenting.
- Use the project's `tailwind.config.ts` for brand tokens; don't introduce ad-hoc colors.

### 5.6 Supabase (1 day)

- **[Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)** — official tutorial covering auth + database.
- **[Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security)** — the single most important Supabase concept. You'll write a lot of RLS policies for Lumen.
- **[Supabase Auth docs](https://supabase.com/docs/guides/auth)** — covers signup, signin, password reset, session management.

### 5.7 Paystack (half a day)

- **[Paystack documentation — Accept payments](https://paystack.com/docs/payments/accept-payments/)** — the standard flow.
- **[Webhooks](https://paystack.com/docs/payments/webhooks/)** — the most-critical-to-get-right piece. Signature verification is non-negotiable.
- **[Paystack Ghana — compliance and KYC](https://support.paystack.com/en/articles/2123842)** — what Charity needs to provide and the Starter vs Registered distinction.
- Use **test mode** for everything in Sprint 0–2; switch to live mode only at launch readiness.

### 5.8 Testing (1 day, ramps over time)

- **[Vitest Getting Started](https://vitest.dev/guide/)** — for unit tests on pure functions.
- **[Playwright Getting Started](https://playwright.dev/docs/intro)** — for end-to-end tests on user flows.
- Rule: every new server action gets a unit test. Every critical user flow (sign-in, checkout) gets one Playwright e2e test before merging.

### 5.9 Accessibility (half a day)

- **[WCAG 2.1 AA quick reference (W3C)](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_overview&levels=aaa)** — the official spec, surprisingly readable in this format.
- **[a11y Project Checklist](https://www.a11yproject.com/checklist/)** — practical pre-launch checklist.
- Read Section 15 of `Lumen_Handoff_v1.docx` for the project-specific bar.

---

## 6. First two-week onboarding plan for the junior dev

If they're ramping cold, run this plan in parallel with Sprint 0–1 build work. The experienced dev focuses on Sprint 0 setup; junior dev does this learning path.

### Week 1 (1–7 June)

- **Mon:** Git + GitHub Skills modules (Section 5.1). End of day: pushes a "hello-world" PR to a sandbox repo, gets it reviewed.
- **Tue:** TypeScript essentials (5.2) + React Foundations Day 1 (5.3, first half).
- **Wed:** React Foundations Day 2 (5.3, second half) — builds a small interactive todo or counter component.
- **Thu:** Next.js Foundations course chapters 1–6 (5.4) — gets the basic routing + layouts concept.
- **Fri:** Next.js Foundations course chapters 7–12 (5.4) — covers data fetching, auth, streaming.

End of Week 1, junior dev pairs with experienced dev on one Tier 1 story (US-P0-09 — Partner Clinics directory is a good first one: mostly content rendering, low risk).

### Week 2 (8–14 June)

- **Mon:** Tailwind (5.5) + read `Lumen_CLAUDE.md` and `Lumen_Handoff_v1.docx` thoroughly (the latter takes a couple of hours).
- **Tue:** Supabase Next.js quickstart + RLS guide (5.6). Pair with experienced dev to set up the project's first table.
- **Wed–Thu:** First solo Tier 1 story — junior picks **US-P0-01 (Browse the frames collection)** or **US-P0-08 (View order history)**. PR review by experienced dev.
- **Fri:** Paystack docs read-through (5.7). Watch experienced dev integrate checkout; ask questions.

By end of Week 2, junior dev has shipped one feature solo and has learned the rhythm.

---

## 7. Daily and weekly rituals

### Daily (every working day)

- **Async standup** (5 minutes, on WhatsApp): "Yesterday I did X, today I'm doing Y, blocked on Z." Junior dev posts first; experienced dev replies with unblocks.
- **Pull from `main`** before starting new work.
- **Push your branch** at end of day even if it's WIP. Use draft PRs to surface work-in-progress.

### Weekly (every Monday)

- **30-minute planning call.** Review which user stories are slated for the week. Adjust tier scope if blockers emerged.
- **Tuesday after lunch: review the checkpoint dates** in `Lumen_Requirements_v1.docx` against reality. Surface slips to Charity early.

### At Week-5 checkpoint (Mon 29 June)

- Joint review of Tier 1 + Tier 2 status. Decide Tier 3 in/out together. Document the call in `STATUS.md`.

---

## 8. Junior-dev gotchas and pitfalls

These are the things that bite new devs. Print this section and put it next to your keyboard.

1. **Never commit secrets.** `.env.local` is in `.gitignore` — keep it that way. If you accidentally commit an API key, **regenerate it immediately** (in the service's dashboard) and treat the leaked one as burned. Don't try to "fix" it with another commit.
2. **Never push to `main` directly.** Branch protection should prevent this anyway, but if you somehow can, don't. Always PR.
3. **Don't merge a PR with failing tests.** Even if you're sure the change is fine. The CI gate exists because once Charity is selling, broken tests in `main` mean broken production.
4. **Don't run `git push --force`.** Use `--force-with-lease` if you must force-push (after rebasing your own feature branch). On `main`, neither is allowed.
5. **Don't run migrations against production without a backup.** Supabase dashboard → snapshot → THEN apply.
6. **Don't write your own auth.** Use Supabase Auth. Don't store passwords. Don't roll your own JWT logic.
7. **Don't disable TypeScript errors with `// @ts-ignore`.** If you really must, add a comment explaining why, and prefer `// @ts-expect-error` so the suppression auto-removes itself when the type becomes correct.
8. **Read the error message before Googling.** TypeScript errors are verbose but specific — the answer is usually in the error.
9. **Ask before adding a new library.** Every new dep is a footgun (security, bundle size, churn). Default to: doesn't need a library? Then don't add one.
10. **Don't trust Claude's first answer on payment / auth code.** Verify against Paystack and Supabase docs. These are the highest-stakes parts of the build.
11. **Don't paste Charity's data (orders, prescriptions) into Claude.** Use seed data or anonymised samples. Real PII shouldn't leave the production database.
12. **When stuck, ask within 30 minutes.** Don't burn an afternoon. The build's tight; surface blockers fast.

---

## 9. Concrete Day-1 setup script (run together with experienced dev)

The morning of Mon 1 June, both devs sit together (in person or screen-share) and run through this. Aim for 3 hours total.

```bash
# 1. Tools (each dev, on their own machine):
node --version    # 20+
pnpm --version    # if missing: npm i -g pnpm
git --version
git config --global user.name "Your Name"
git config --global user.email "you@email"
npm i -g @anthropic-ai/claude-code

# 2. Repo (experienced dev does once):
pnpm create next-app lumen --typescript --eslint --app --tailwind --src-dir
cd lumen
git init && git remote add origin <repo-url>
# Add CLAUDE.md (copy from Outputs/Lumen_CLAUDE.md)
# Add LICENSE, README.md, .gitignore additions if needed

# 3. Charity-owned cloud accounts (experienced dev walks Charity through):
# - Domain registrar
# - Vercel (link the GitHub repo for auto-deploys)
# - Supabase project (note the URL, anon key, service role key)
# - Resend (verify domain in Sprint 0 once domain is registered)
# - Paystack (Starter business setup; note category + enabled channels)

# 4. Each dev sets up locally:
git clone <repo-url>
cd lumen
pnpm install
cp .env.example .env.local
# Fill in env vars
pnpm dev    # see localhost:3000

# 5. Each dev installs MCP servers in Claude Code:
# Add Supabase MCP, GitHub MCP, Next.js DevTools MCP
# Test by asking Claude Code "describe the schema of the orders table"

# 6. Each dev opens Claude Code in the repo and verifies CLAUDE.md loads:
claude
# (Inside the session): "What's in CLAUDE.md?"
# Verify it reads the file
```

---

## 10. Resources index — all links in one place

### Claude tooling
- [Claude Code official docs](https://docs.claude.com/en/docs/claude-code)
- [Claude Code Sub-agents](https://code.claude.com/docs/en/sub-agents)
- [Claude pricing](https://claude.com/pricing)
- [Claude Code Best Practices 2026](https://mcp.directory/blog/claude-code-best-practices)
- [My Claude Code Setup 2026 (community)](https://okhlopkov.com/claude-code-setup-mcp-hooks-skills-2026/)
- [Claude Code features & settings reference 2026](https://hidekazu-konishi.com/entry/claude_code_features_settings_reference_2026.html)
- [Claude Code changelog](https://claudefa.st/blog/guide/changelog)
- [Awesome Claude Code skills repo](https://github.com/GetBindu/awesome-claude-code-and-skills)
- [Best Claude Code Skills 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-claude-code-skills)

### MCP servers
- [Supabase MCP](https://github.com/supabase-community/supabase-mcp)
- [GitHub MCP server](https://github.com/github/github-mcp-server)
- [Next.js DevTools MCP (Vercel)](https://github.com/vercel/next-devtools-mcp)
- [Best MCP Servers for Developers 2026](https://data4ai.com/blog/tool-comparisons/best-mcp-servers-for-developers/)
- [50+ Best MCP Servers](https://mcpplaygroundonline.com/blog/awesome-mcp-servers)

### Next.js
- [Next.js Foundations course (free)](https://nextjs.org/learn/dashboard-app)
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [Next.js Getting Started](https://nextjs.org/docs/app/getting-started)
- [React Foundations course](https://nextjs.org/learn/react-foundations)
- [App Router complete guide 2026](https://dev.to/ottoaria/nextjs-app-router-in-2026-the-complete-guide-for-full-stack-developers-5bjl)

### React + TypeScript
- [React docs](https://react.dev/learn)
- [TypeScript Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Total TypeScript Beginner's Tutorial](https://www.totaltypescript.com/tutorials/beginners-typescript)

### Tailwind
- [Tailwind CSS docs](https://tailwindcss.com/docs/installation)
- [Tailwind Play](https://play.tailwindcss.com)

### Supabase
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Paystack
- [Paystack docs](https://paystack.com/docs)
- [Accept payments](https://paystack.com/docs/payments/accept-payments/)
- [Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack Ghana compliance](https://support.paystack.com/en/articles/2123842)

### Testing
- [Vitest](https://vitest.dev/guide/)
- [Playwright](https://playwright.dev/docs/intro)

### GitHub
- [GitHub Skills (interactive)](https://skills.github.com)
- [Pro Git book (free)](https://git-scm.com/book/en/v2)
- [Learn Git Branching (visual)](https://learngitbranching.js.org/)
- [Branch protection docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [Required reviewer rule (Feb 2026)](https://github.blog/changelog/2026-02-17-required-reviewer-rule-is-now-generally-available/)

### Accessibility
- [WCAG 2.1 AA quick reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)

### Ghana-specific
- [Ghana Data Protection Commission](https://dataprotection.org.gh)
- [Ghana Revenue Authority — E-Levy](https://gra.gov.gh/elevy-faq/)
- [GhanaPostGPS](https://www.ghanapostgps.com)
- [libphonenumber-js (phone normalization)](https://www.npmjs.com/package/libphonenumber-js)

### Vercel
- [Vercel docs — deployments](https://vercel.com/docs/deployments/overview)
- [Vercel pricing](https://vercel.com/pricing)

### Resend
- [Resend Next.js integration](https://resend.com/docs/send-with-nextjs)
- [Resend pricing](https://resend.com/pricing)

---

## 11. What this guide doesn't cover (and where to find it)

- **Specific build patterns for each user story** → `Outputs/Lumen_Handoff_v1.docx` Section 6.
- **Code conventions, file structure, do/don't list** → `Outputs/Lumen_CLAUDE.md`.
- **Commercial terms, IP, milestones** → `Outputs/Lumen_Proposal_v3.docx`.
- **What Charity owes by when** → `Outputs/Lumen_Requirements_v1.docx`.
- **Sprint 0 day-by-day checklist** → `Research/lumen_dev_research_brief_v1.md`.

---

## 12. A note on AI-assisted coding for the junior dev

Claude Code is genuinely useful, especially in a learning context — but it's not a substitute for understanding. Practical rules:

1. **Read every line Claude writes before accepting it.** If you don't understand it, ask Claude to explain. Then ask again. The goal is for you to be able to maintain this code without Claude in six months.
2. **Don't accept the first answer for high-stakes code.** Auth, payments, RLS policies, and webhook signature verification — read the official docs and verify Claude's output matches.
3. **Use Claude to learn, not to skip learning.** When you don't know how something works, ask "explain this Next.js Server Component pattern with a simple example" — that's faster than docs, often clearer, and the answer goes into your head.
4. **Be specific in prompts.** "Make a checkout page" gets you generic React. "Build a checkout step component in `src/components/checkout/payment-step.tsx` that accepts a `cart` prop typed as `CartItem[]`, displays Paystack MoMo + card + COD options as radio buttons, and submits via the `initiateCheckout` server action — match the visual style in `Designs/checkout.jsx`" gets you something you can ship.
5. **Test what Claude builds.** Always. Run it. Click through it. Check the edge cases. Claude doesn't always run the code it writes; you should.

---

**Last updated:** 31 May 2026
**Maintainers:** Bryan & Etornam — update this guide as the team learns what works.
**Companion docs:** Lumen_Handoff_v1.docx, Lumen_CLAUDE.md, lumen_dev_research_brief_v1.md.

Sources for this guide:
- [Claude Code Setup 2026 — MCP, Hooks, Skills](https://okhlopkov.com/claude-code-setup-mcp-hooks-skills-2026/)
- [Claude Code Features & Settings Reference 2026](https://hidekazu-konishi.com/entry/claude_code_features_settings_reference_2026.html)
- [Claude Code Updates by Anthropic — May 2026](https://releasebot.io/updates/anthropic/claude-code)
- [Claude Code Best Practices: From Vibe Coding to Agentic Engineering (2026)](https://mcp.directory/blog/claude-code-best-practices)
- [Claude Code Agent Teams, Subagents, and MCP: The 2026 Playbook](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026)
- [Best MCP Servers for Developers in 2026 (Data4AI)](https://data4ai.com/blog/tool-comparisons/best-mcp-servers-for-developers/)
- [50+ Best MCP Servers in 2026](https://mcpplaygroundonline.com/blog/awesome-mcp-servers)
- [Claude Code Pricing 2026 (SSDNodes)](https://www.ssdnodes.com/blog/claude-code-pricing-in-2026-every-plan-explained-pro-max-api-teams/)
- [Required reviewer rule is now GA (GitHub Changelog, Feb 2026)](https://github.blog/changelog/2026-02-17-required-reviewer-rule-is-now-generally-available/)
- [Next.js App Router in 2026: The Complete Guide](https://dev.to/ottoaria/nextjs-app-router-in-2026-the-complete-guide-for-full-stack-developers-5bjl)
