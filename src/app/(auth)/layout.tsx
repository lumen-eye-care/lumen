import Link from "next/link";

/**
 * Centered card shell for every (auth) screen. Server Component — no client JS.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Link href="/" className="text-center">
        <span
          className="text-sm uppercase tracking-[0.2em]"
          style={{ color: "var(--lm-sage)" }}
        >
          Lumen Eye Care
        </span>
      </Link>
      <div
        className="rounded-xl p-6 sm:p-8"
        style={{
          border: "1px solid var(--lm-hair)",
          background: "var(--lm-raise)",
          boxShadow: "0 4px 24px var(--lm-shadow)",
        }}
      >
        {children}
      </div>
    </main>
  );
}
