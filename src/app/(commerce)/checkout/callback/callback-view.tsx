"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

const POLL_MS = 3000;
const MAX_MS = 5 * 60 * 1000; // MoMo confirmation can be slow; poll up to 5 min.

type CallbackState = "polling" | "failed" | "timeout" | "error";

export function CallbackView({ reference }: { reference: string | null }) {
  const router = useRouter();
  const { clear } = useCart();
  const [state, setState] = useState<CallbackState>(reference ? "polling" : "error");
  const startedAt = useRef(0);

  useEffect(() => {
    if (!reference) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    startedAt.current = Date.now();

    async function poll() {
      try {
        const res = await fetch(
          `/api/orders/status?reference=${encodeURIComponent(reference!)}`,
        );
        const json = await res.json();
        if (!active) return;
        if (json.status === "paid") {
          clear();
          router.replace(`/checkout/success?id=${json.orderId}`);
          return;
        }
        if (json.status === "failed" || json.status === "failed_timeout") {
          setState("failed");
          return;
        }
      } catch {
        // transient — keep polling until the deadline
      }
      if (!active) return;
      if (Date.now() - startedAt.current > MAX_MS) {
        setState("timeout");
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [reference, router, clear]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      {state === "polling" && (
        <>
          <div
            className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-lumen-ink/15 border-t-lumen-blue"
            aria-hidden
          />
          <h1 className="font-display text-2xl text-lumen-ink">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-lumen-ink/60">
            If you paid with Mobile Money, approve the prompt on your phone. This can take a
            moment — please don&apos;t close this page.
          </p>
        </>
      )}

      {state === "timeout" && (
        <>
          <h1 className="font-display text-2xl text-lumen-ink">Still processing</h1>
          <p className="mt-2 text-sm text-lumen-ink/60">
            Your payment is taking longer than usual. If it went through, we&apos;ll email you a
            confirmation and it will appear in your account shortly.
          </p>
          <Link
            href="/account/orders"
            className="mt-6 rounded-md border border-lumen-ink/15 px-5 py-2.5 text-sm font-medium text-lumen-ink transition-colors hover:border-lumen-ink/40"
          >
            View my orders
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <h1 className="font-display text-2xl text-lumen-ink">Payment not completed</h1>
          <p className="mt-2 text-sm text-lumen-ink/60">
            Your payment didn&apos;t go through. Your bag is still saved — you can try again.
          </p>
          <Link
            href="/checkout"
            className="mt-6 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink"
          >
            Back to checkout
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <h1 className="font-display text-2xl text-lumen-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-lumen-ink/60">
            We couldn&apos;t read your payment reference. If you were charged, check your orders
            or contact us.
          </p>
          <Link
            href="/account/orders"
            className="mt-6 rounded-md border border-lumen-ink/15 px-5 py-2.5 text-sm font-medium text-lumen-ink transition-colors hover:border-lumen-ink/40"
          >
            View my orders
          </Link>
        </>
      )}
    </main>
  );
}
