/**
 * Open-redirect guard (CLAUDE.md security rule 2).
 * Every user-supplied redirect target (?redirect=, ?next=, ?callback=) must pass
 * through this before any Response.redirect / redirect() call.
 */
export function safeRedirect(input: string | null, fallback = "/"): string {
  if (!input) return fallback;
  // Must be a relative path; reject protocol-relative (//evil) and absolute URLs.
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;
  // Reject javascript:, data:, vbscript: (defensive — the check above already covers it).
  if (/^\s*(javascript|data|vbscript):/i.test(input)) return fallback;
  return input;
}
