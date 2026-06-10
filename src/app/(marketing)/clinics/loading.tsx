/**
 * Skeleton — shown while the dynamic /clinics page streams in.
 * Mirrors the hero + stacked clinic-card layout to avoid layout shift.
 */

function SkeletonClinicCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white ring-1 ring-lumen-ink/8 md:grid md:grid-cols-[280px_1fr]">
      <div className="min-h-[160px] bg-lumen-ink/5 md:min-h-full" />
      <div className="space-y-3 p-6">
        <div className="h-6 w-1/3 rounded bg-lumen-ink/8" />
        <div className="h-4 w-1/2 rounded bg-lumen-ink/5" />
        <div className="h-4 w-2/5 rounded bg-lumen-ink/5" />
        <div className="space-y-2 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-64 rounded bg-lumen-ink/5" />
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-10 w-28 rounded-md bg-lumen-ink/8" />
          <div className="h-10 w-20 rounded-md bg-lumen-ink/5" />
          <div className="h-10 w-36 rounded-md bg-lumen-ink/5" />
        </div>
      </div>
    </div>
  );
}

export default function ClinicsLoading() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-lumen-ink/8 bg-lumen-cream px-6 pb-10 pt-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center">
          <div className="mb-5 h-3 w-24 animate-pulse rounded bg-lumen-ink/8" />
          <div className="mb-3 h-3 w-32 animate-pulse rounded bg-lumen-ink/8" />
          <div className="mb-3 h-10 w-80 animate-pulse rounded bg-lumen-ink/8 sm:h-12" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-lumen-ink/5" />
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="flex flex-col gap-6">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonClinicCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
