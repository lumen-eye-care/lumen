import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-5xl text-lumen-ink">Page not found</h1>
      <p className="text-lumen-ink/70">
        We couldn&rsquo;t find that page. Let&rsquo;s get you back.
      </p>
      <div className="flex gap-4">
        <Link href="/" className="text-lumen-blue underline">
          Home
        </Link>
        <Link href="/shop" className="text-lumen-blue underline">
          Shop the collection
        </Link>
      </div>
    </main>
  );
}
