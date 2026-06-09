import type { Event } from "@sentry/nextjs";

/**
 * Single source of truth for Rule-10 redaction (CLAUDE.md security rule 10:
 * never send PII to a third party). Used as `beforeSend`/`beforeSendTransaction`
 * by every Sentry config (server, edge, client) so error payloads can never
 * carry customer data — emails, phone numbers, payment references, order/
 * prescription detail, cookies, or auth headers.
 *
 * Pure + synchronous so it is unit-testable without the SDK runtime.
 */

const REDACTED = "[redacted]";

// Headers that must never leave the app.
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-paystack-signature",
]);

// Object keys whose VALUE is redacted wholesale, regardless of shape.
const SENSITIVE_KEY =
  /(email|phone|password|passwd|secret|token|authorization|cookie|signature|reference|ip_address|ipaddress)/i;

// Free-text patterns scrubbed inside any string value (error messages,
// breadcrumb text, etc.): email + Ghana phone (E.164 +233… or local 0XXXXXXXXX).
const PII_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /(?:\+233|0)\d{9}\b/g,
];

function redact(input: string): string {
  let out = input;
  for (const re of PII_PATTERNS) out = out.replace(re, REDACTED);
  return out;
}

function redactDeep(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return redact(value);
  if (Array.isArray(value)) {
    return depth < 4 ? value.map((v) => redactDeep(v, depth + 1)) : value;
  }
  if (value && typeof value === "object") {
    if (depth >= 4) return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? REDACTED : redactDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Scrub a Sentry event in place and return it. Drops user identity entirely,
 * strips request bodies/cookies/query-strings/sensitive headers, and redacts
 * PII-shaped values from messages, exception values, breadcrumbs, extra, and
 * contexts. Intentionally over-redacts — false positives are harmless here.
 */
export function scrubEvent<T extends Event>(event: T): T {
  // User identity (id, email, ip_address, username) — never needed.
  delete event.user;

  if (event.request) {
    delete event.request.data; // request body
    delete event.request.cookies;
    event.request.query_string = undefined; // e.g. ?reference=<payment ref>
    if (typeof event.request.url === "string") {
      const q = event.request.url.indexOf("?");
      if (q !== -1) event.request.url = event.request.url.slice(0, q);
    }
    if (event.request.headers) {
      for (const key of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
          event.request.headers[key] = REDACTED;
        }
      }
    }
  }

  if (typeof event.message === "string") {
    event.message = redact(event.message);
  }

  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (typeof ex.value === "string") ex.value = redact(ex.value);
    }
  }

  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) {
      if (typeof crumb.message === "string") crumb.message = redact(crumb.message);
      if (crumb.data) crumb.data = redactDeep(crumb.data) as typeof crumb.data;
    }
  }

  if (event.extra) event.extra = redactDeep(event.extra) as typeof event.extra;
  if (event.contexts) event.contexts = redactDeep(event.contexts) as typeof event.contexts;

  return event;
}
