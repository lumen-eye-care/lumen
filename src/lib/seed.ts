/**
 * Dev seed — populates the local/staging database with mock frames + clinics +
 * one admin user (env-driven credentials). Run with `pnpm seed`. NEVER run
 * against production.
 *
 * Bodies are filled in Sprint 1 once the schema is live (US-P0-01 catalogue,
 * US-P0-09 clinics). Kept as an executable stub so `pnpm seed` is wired now.
 */
async function main(): Promise<void> {
  console.log(
    "Lumen seed: scaffold only. Implement in Sprint 1 once 0001_init.sql is applied.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
