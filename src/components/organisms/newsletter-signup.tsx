"use client";

import { useActionState } from "react";
import {
  subscribeNewsletter,
  type NewsletterState,
} from "./newsletter-actions";

/**
 * Footer newsletter signup. Writes to public.newsletter_signups via a server
 * action (RLS: anonymous insert only, admin read). Replaces the old
 * non-functional markup stub.
 */
export function NewsletterSignup() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletter,
    { status: "idle" },
  );

  const done = state.status === "success";

  return (
    <div>
      <form
        action={action}
        className="flex overflow-hidden rounded-full border"
        style={{ borderColor: "var(--lm-hair)" }}
      >
        <input
          type="email"
          name="email"
          required
          placeholder="Email for new arrivals"
          aria-label="Subscribe to email updates"
          disabled={pending || done}
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none disabled:opacity-60"
          style={{ color: "var(--lm-text)" }}
        />
        <button
          type="submit"
          disabled={pending || done}
          className="border-l px-4 py-2 text-xs font-medium transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--lm-warm)] disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: "var(--lm-hair)", color: "var(--lm-text)" }}
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>
      {state.status === "success" && (
        <p
          role="status"
          className="mt-2 px-1 text-xs"
          style={{ color: "var(--lm-sage-text)" }}
        >
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p
          role="alert"
          className="mt-2 px-1 text-xs"
          style={{ color: "var(--lm-warm-text)" }}
        >
          {state.error}
        </p>
      )}
    </div>
  );
}
