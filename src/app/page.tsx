export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-lumen-sage">
        Lumen Eye Care
      </p>
      <h1 className="font-display text-5xl leading-tight text-lumen-ink sm:text-6xl">
        Premium eyewear,{" "}
        <em className="italic text-lumen-blue">designed in Ghana</em>.
      </h1>
      <p className="max-w-md text-balance text-lumen-ink/70">
        The launch site is being built. Our inaugural frames collection arrives
        July 2026.
      </p>
      <span className="rounded-full bg-lumen-warm/15 px-4 py-1.5 text-sm text-lumen-warm">
        Sprint 0 — scaffold live
      </span>
    </main>
  );
}
