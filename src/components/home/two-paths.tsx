import Link from "next/link";
import { Icon } from "@/components/atoms/icon";

/**
 * Two Paths — replaces the prototype's six-card services grid with a single
 * editorial fork that answers the only question a new visitor has: "where do I
 * start?" Two routes into Lumen, then a three-step strip showing the whole
 * journey. Services that aren't a starting point (try-on, prescription upload)
 * live where they belong — inside the shopping flow — not as competing cards.
 */

const STEPS = [
  {
    n: "01",
    k: "Test",
    v: "A 30-minute eye test with a Lumen optometrist — in clinic or at home.",
  },
  {
    n: "02",
    k: "Choose frames",
    v: "Pick from the collection. Upload or add your prescription as you check out.",
  },
  {
    n: "03",
    k: "We fit",
    v: "Our lab cuts your lenses to the frame and delivers across Ghana.",
  },
];

export function TwoPaths() {
  return (
    <section className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl" data-animate>
          <p className="lm-label">Where to start</p>
          <h2
            className="lm-display mt-4"
            style={{ fontSize: "clamp(2rem, 5.5vw, 3.6rem)" }}
          >
            Two ways in.
          </h2>
        </div>

        {/* The fork */}
        <div data-stagger className="mt-14 grid gap-6 lg:grid-cols-2">
          <PathCard
            eyebrow="New to Lumen"
            title="Start with an eye test"
            body="Not sure of your prescription? Book a clinical eye test — refraction, retinal imaging and ocular health — then choose frames with confidence."
            href="/book"
            cta="Book an eye test"
            icon="eye"
          />
          <PathCard
            eyebrow="Already have a prescription"
            title="Go straight to frames"
            body="Know your numbers? Browse the collection and add your prescription at checkout. We'll cut the lenses and deliver."
            href="/shop"
            cta="Shop the collection"
            icon="glasses"
          />
        </div>

        {/* The journey */}
        <div
          data-stagger
          className="mt-16 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-3"
          style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-hair)" }}
        >
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="p-7"
              style={{ background: "var(--lm-base)" }}
            >
              <span
                className="lm-display block text-3xl"
                style={{ color: "var(--lm-warm)" }}
              >
                {s.n}
              </span>
              <h3
                className="mt-3 text-base font-semibold"
                style={{ color: "var(--lm-text)" }}
              >
                {s.k}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--lm-muted)" }}
              >
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PathCard({
  eyebrow,
  title,
  body,
  href,
  cta,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: "eye" | "glasses";
}) {
  return (
    <Link href={href} className="lm-card group flex flex-col p-8 sm:p-10">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--lm-tint)", color: "var(--lm-warm)" }}
      >
        <Icon name={icon} size={22} />
      </div>
      <p className="lm-label mt-6">{eyebrow}</p>
      <h3
        className="lm-display mt-3"
        style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}
      >
        {title}
      </h3>
      <p
        className="mt-4 max-w-md flex-1 text-[15px] leading-relaxed"
        style={{ color: "var(--lm-muted)" }}
      >
        {body}
      </p>
      <span
        className="mt-7 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
        style={{ color: "var(--lm-warm)" }}
      >
        {cta}
        <Icon
          name="arrow"
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
