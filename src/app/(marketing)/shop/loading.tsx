/**
 * Skeleton grid — shown by Next.js while the dynamic /shop page streams in.
 * Mirrors the real layout so there's no jarring shift on load.
 */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white ring-1 ring-lumen-ink/8">
      <div className="h-[188px] rounded-t-xl bg-lumen-ink/5" />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-2/3 rounded bg-lumen-ink/8" />
          <div className="h-4 w-1/4 rounded bg-lumen-ink/8" />
        </div>
        <div className="h-3 w-1/2 rounded bg-lumen-ink/5" />
        <div className="mt-2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[18px] w-[18px] rounded-full bg-lumen-ink/8"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <section className="border-b border-lumen-ink/8 bg-lumen-cream px-6 pb-8 pt-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-5 h-3 w-24 animate-pulse rounded bg-lumen-ink/8" />
          <div className="mb-2 h-10 w-72 animate-pulse rounded bg-lumen-ink/8 sm:h-12" />
          <div className="mb-6 h-4 w-96 animate-pulse rounded bg-lumen-ink/5" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-9 w-28 animate-pulse rounded-full bg-lumen-ink/8"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Body skeleton */}
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="flex items-start gap-8">
          {/* Sidebar skeleton */}
          <aside className="hidden w-[220px] shrink-0 space-y-4 lg:block">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 border-b border-lumen-ink/8 py-4">
                <div className="h-4 w-24 animate-pulse rounded bg-lumen-ink/8" />
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-4 w-32 animate-pulse rounded bg-lumen-ink/5" />
                ))}
              </div>
            ))}
          </aside>

          {/* Grid skeleton */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-32 animate-pulse rounded bg-lumen-ink/8" />
              <div className="h-8 w-36 animate-pulse rounded bg-lumen-ink/8" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
