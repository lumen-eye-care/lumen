"use client";

import { useState, useTransition } from "react";

/**
 * Opens a prescription file in a NEW TAB (US-P1-03). The signed URL is minted +
 * audit-logged server-side by `getUrl` (a server action passed in by the customer
 * or admin page); we just window.open the result so the user keeps their current
 * page. Falls back to an inline error if the URL can't be produced.
 */
export function OpenFileButton({
  id,
  getUrl,
  label = "View",
  className,
}: {
  id: string;
  getUrl: (id: string) => Promise<{ url?: string; error?: string }>;
  label?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await getUrl(id);
            if (res.url) {
              window.open(res.url, "_blank", "noopener,noreferrer");
            } else {
              setError(res.error ?? "Could not open the file.");
            }
          })
        }
        className={className}
      >
        {pending ? "Opening…" : label}
      </button>
      {error && (
        <span className="text-xs" style={{ color: "var(--lm-warm-text)" }} role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
