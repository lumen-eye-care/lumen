/**
 * Manifesto — a sparse, wide-margin brand statement on the darkest surface.
 * Lines reveal in sequence as the block scrolls in (data-stagger → CSS). One
 * terracotta hairline is the only ornament. Reads as editorial, not marketing.
 */
export function Manifesto() {
  return (
    <section
      className="relative px-6 py-32 sm:py-44"
      style={{ background: "var(--pv-deep)" }}
    >
      <div className="mx-auto max-w-4xl">
        <div
          className="h-px w-16"
          style={{ background: "var(--pv-warm)" }}
          aria-hidden="true"
        />
        <p className="pv-label mt-6" data-animate>
          Why Lumen
        </p>

        <div data-stagger className="mt-10">
          <p
            className="pv-display"
            style={{
              fontSize: "clamp(1.8rem, 5vw, 3.4rem)",
              lineHeight: 1.12,
              color: "var(--pv-text)",
            }}
          >
            Most eyewear is sold to you from a shelf.
          </p>
          <p
            className="pv-display mt-2"
            style={{
              fontSize: "clamp(1.8rem, 5vw, 3.4rem)",
              lineHeight: 1.12,
              color: "var(--pv-muted)",
            }}
          >
            We build it{" "}
            <em style={{ fontStyle: "italic", color: "var(--pv-warm)" }}>
              around your eyes
            </em>{" "}
            — measured by an optometrist, cut for your prescription, finished in
            materials chosen to last a decade, not a season.
          </p>
        </div>

        <div
          data-stagger
          className="mt-16 grid gap-10 sm:grid-cols-3"
          style={{ color: "var(--pv-muted)" }}
        >
          {[
            {
              k: "Designed in Ghana",
              v: "Drawn in Accra, made for Ghanaian faces, light and climate.",
            },
            {
              k: "Clinical, not casual",
              v: "Every order pairs with a real eye test at a Lumen clinic.",
            },
            {
              k: "Built to outlast trends",
              v: "Italian acetate, Japanese titanium, Swiss lenses. No shortcuts.",
            },
          ].map((item) => (
            <div key={item.k}>
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--pv-text)" }}
              >
                {item.k}
              </h3>
              <p className="mt-2 text-sm leading-relaxed">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
