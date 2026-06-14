import Link from "next/link";
import { Icon, type IconName } from "@/components/atoms/icon";

/**
 * Reusable empty-state block (no data / cleared / nothing-found).
 * Centred icon + title + body, with an optional CTA (internal Link or button).
 * Used by the cart now; reusable on /shop empty and future routes.
 */

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: React.ReactNode;
  /** Internal CTA link. */
  cta?: { label: string; href: string };
  /** Button CTA (e.g. dismiss a drawer). Ignored if `cta` is set. */
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({
  icon = "cart",
  title,
  description,
  cta,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 px-6 py-12 text-center ${className}`}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--lm-tint)", color: "var(--lm-faint)" }}
      >
        <Icon name={icon} size={24} strokeWidth={1} />
      </div>
      <div className="space-y-1.5">
        <h2 className="lm-display text-2xl" style={{ color: "var(--lm-text)" }}>
          {title}
        </h2>
        {description && (
          <p
            className="mx-auto max-w-sm text-sm leading-relaxed"
            style={{ color: "var(--lm-muted)" }}
          >
            {description}
          </p>
        )}
      </div>

      {cta ? (
        <Link href={cta.href} className="lm-pill mt-1">
          {cta.label}
        </Link>
      ) : action ? (
        <button type="button" onClick={action.onClick} className="lm-pill mt-1">
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
