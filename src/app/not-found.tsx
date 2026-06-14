import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="lm-display text-5xl" style={{ color: "var(--lm-text)" }}>
        Page not found
      </h1>
      <p style={{ color: "var(--lm-muted)" }}>
        We couldn&rsquo;t find that page. Let&rsquo;s get you back.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="underline underline-offset-2"
          style={{ color: "var(--lm-warm)" }}
        >
          Home
        </Link>
        <Link
          href="/shop"
          className="underline underline-offset-2"
          style={{ color: "var(--lm-warm)" }}
        >
          Shop the collection
        </Link>
      </div>
    </main>
  );
}
