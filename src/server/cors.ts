import "server-only";

/**
 * CORS allowlist (CLAUDE.md security rule 1). No wildcards, ever.
 * v1 routes are same-origin and shouldn't need CORS at all; this exists so that
 * if a route ever genuinely needs cross-origin access it allowlists explicitly.
 */
const ALLOWED_ORIGINS = [
  "https://lumeneye.org",
  "https://www.lumeneye.org",
  "https://staging.lumeneye.org",
  "http://localhost:3000",
];

export function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}
