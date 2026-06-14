/**
 * Skeleton — shown while the dynamic /clinics page streams in.
 * Mirrors the hero + stacked clinic-card layout to avoid layout shift.
 */

function SkeletonClinicCard() {
  return (
    <div
      className="lm-card animate-pulse overflow-hidden md:grid md:grid-cols-[280px_1fr]"
    >
      <div className="min-h-[160px] md:min-h-full" style={{ background: "var(--lm-deep)" }} />
      <div className="space-y-3 p-6">
        <div className="h-6 w-1/3 rounded" style={{ background: "var(--lm-tint)" }} />
        <div className="h-4 w-1/2 rounded" style={{ background: "var(--lm-surface)" }} />
        <div className="h-4 w-2/5 rounded" style={{ background: "var(--lm-surface)" }} />
        <div className="space-y-2 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-64 rounded" style={{ background: "var(--lm-surface)" }} />
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-10 w-28 rounded-md" style={{ background: "var(--lm-tint)" }} />
          <div className="h-10 w-20 rounded-md" style={{ background: "var(--lm-surface)" }} />
          <div className="h-10 w-36 rounded-md" style={{ background: "var(--lm-surface)" }} />
        </div>
      </div>
    </div>
  );
}

export default function ClinicsLoading() {
  return (
    <div className="min-h-screen">
      <section
        className="border-b px-6 pb-10 pt-8"
        style={{
          borderColor: "var(--lm-hair)",
          background:
            "radial-gradient(120% 120% at 50% 0%, var(--lm-raise) 0%, var(--lm-base) 60%)",
        }}
      >
        <div className="mx-auto flex max-w-[1280px] flex-col items-center">
          <div className="mb-5 h-3 w-24 animate-pulse rounded" style={{ background: "var(--lm-tint)" }} />
          <div className="mb-3 h-3 w-32 animate-pulse rounded" style={{ background: "var(--lm-tint)" }} />
          <div className="mb-3 h-10 w-80 animate-pulse rounded sm:h-12" style={{ background: "var(--lm-tint)" }} />
          <div className="h-4 w-96 max-w-full animate-pulse rounded" style={{ background: "var(--lm-surface)" }} />
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
