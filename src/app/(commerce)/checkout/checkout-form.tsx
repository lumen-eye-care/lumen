"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { EmptyState } from "@/components/atoms/empty-state";
import { formatGhs } from "@/lib/format-money";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/checkout-schemas";
import { placeCodOrder } from "./actions";

const METHOD_LABELS: Record<PaymentMethod, { title: string; hint: string }> = {
  momo: { title: "Mobile Money", hint: "MTN MoMo · Telecel Cash · AT Money" },
  card: { title: "Debit / Credit card", hint: "Secure card payment via Paystack" },
  cod: { title: "Cash on delivery", hint: "Pay when your frames arrive" },
};

const inputClass =
  "mt-1 w-full rounded-md border border-[color:var(--lm-hair)] bg-[var(--lm-base)] px-3 py-2.5 text-sm text-[color:var(--lm-text)] placeholder:text-[color:var(--lm-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]";

export function CheckoutForm() {
  const { items, subtotalPesewa, hydrated, clear } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(
    () => items.map((i) => ({ frameId: i.frameId, colorName: i.colorName, qty: i.qty })),
    [items],
  );

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="h-8 w-48 animate-pulse rounded" style={{ background: "var(--lm-tint)" }} />
        <div className="mt-8 h-64 animate-pulse rounded-xl" style={{ background: "var(--lm-surface)" }} />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
        <EmptyState
          title="Your bag is empty"
          description="Add a frame before checking out."
          cta={{ label: "Shop the collection", href: "/shop" }}
        />
      </main>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const delivery = { name, phone, city, address, landmark };

    if (method === "cod") {
      const res = await placeCodOrder({ delivery, lines });
      if (res.ok) {
        clear();
        router.push(`/checkout/success?id=${res.orderId}`);
        return;
      }
      setError(res.error);
      setSubmitting(false);
      return;
    }

    // MoMo / card → Paystack hosted checkout.
    try {
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ delivery, method, lines }),
      });
      const json = await res.json();
      if (!res.ok || !json.authorization_url) {
        setError(json.error ?? "Payment could not be started. Please try again.");
        setSubmitting(false);
        return;
      }
      // Leave the bag intact until payment is confirmed on the success page.
      window.location.assign(json.authorization_url);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const submitLabel =
    method === "cod"
      ? "Place order"
      : `Pay ${formatGhs(subtotalPesewa)} with ${method === "momo" ? "Mobile Money" : "card"}`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="lm-display mb-8 text-3xl" style={{ color: "var(--lm-text)" }}>
        Checkout
      </h1>

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        {/* Left: delivery + payment */}
        <div className="space-y-8">
          <section>
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--lm-faint)" }}
            >
              Delivery details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span style={{ color: "var(--lm-muted)" }}>Full name</span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: "var(--lm-muted)" }}>Phone</span>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  inputMode="tel"
                  placeholder="024 123 4567"
                  autoComplete="tel"
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: "var(--lm-muted)" }}>City / town</span>
                <input
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  autoComplete="address-level2"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span style={{ color: "var(--lm-muted)" }}>Delivery address</span>
                <input
                  className={inputClass}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Street, house number, area"
                  autoComplete="street-address"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span style={{ color: "var(--lm-muted)" }}>
                  Nearest landmark{" "}
                  <span style={{ color: "var(--lm-faint)" }}>(optional)</span>
                </span>
                <input
                  className={inputClass}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. opposite the Total filling station"
                />
              </label>
            </div>
          </section>

          <section>
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--lm-faint)" }}
            >
              Payment method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
                  style={{
                    borderColor:
                      method === m
                        ? "var(--lm-warm)"
                        : "var(--lm-hair)",
                    background:
                      method === m
                        ? "color-mix(in srgb, var(--lm-warm) 8%, transparent)"
                        : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="mt-1 accent-[color:var(--lm-warm)]"
                  />
                  <span>
                    <span className="block text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                      {METHOD_LABELS[m].title}
                    </span>
                    <span className="block text-xs" style={{ color: "var(--lm-faint)" }}>
                      {METHOD_LABELS[m].hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Right: summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="rounded-xl p-5"
            style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-raise)" }}
          >
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--lm-faint)" }}
            >
              Order summary
            </h2>
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={`${i.frameId}::${i.colorName}`}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span style={{ color: "var(--lm-muted)" }}>
                    {i.name} · {i.colorName}
                    {i.qty > 1 && (
                      <span style={{ color: "var(--lm-faint)" }}> × {i.qty}</span>
                    )}
                  </span>
                  <span className="shrink-0" style={{ color: "var(--lm-text)" }}>
                    {formatGhs(i.unitPricePesewa * i.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="mt-4 flex items-center justify-between border-t pt-4"
              style={{ borderColor: "var(--lm-hair)" }}
            >
              <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
                Total
              </span>
              <span className="text-lg font-medium" style={{ color: "var(--lm-text)" }}>
                {formatGhs(subtotalPesewa)}
              </span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--lm-faint)" }}>
              Prices confirmed at the server. Delivery arranged after your order.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-md px-3 py-2 text-sm"
                style={{
                  background: "color-mix(in srgb, var(--lm-warm) 12%, transparent)",
                  color: "var(--lm-warm)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="lm-pill mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Processing…" : submitLabel}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}
