"use client";

/**
 * Route-level error boundary for the commerce funnel (cart + checkout).
 * Replaces the "swallowed error looks like empty" failure mode with an explicit
 * recoverable state. First shared error boundary in the app — the broader
 * retrofit of other segments is a later pass.
 */

import { useEffect } from "react";
import { Icon } from "@/components/atoms/icon";

export default function CommerceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for monitoring; no PII in commerce errors at this stage.
    console.error("[commerce] route error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lumen-warm/10 text-lumen-warm">
        <Icon name="x" size={24} strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-3xl text-lumen-ink">Something went wrong</h1>
      <p className="text-sm text-lumen-ink/50">
        We couldn&rsquo;t load your bag just now. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
      >
        Try again
      </button>
    </main>
  );
}
