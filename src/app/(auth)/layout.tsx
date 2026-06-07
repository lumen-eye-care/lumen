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
        <span className="text-sm uppercase tracking-[0.2em] text-lumen-sage">
          Lumen Eye Care
        </span>
      </Link>
      <div className="rounded-lg border border-lumen-ink/10 bg-white/60 p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
