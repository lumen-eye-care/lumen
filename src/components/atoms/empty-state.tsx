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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lumen-ink/5 text-lumen-ink/30">
        <Icon name={icon} size={24} strokeWidth={1} />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl text-lumen-ink">{title}</h2>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-lumen-ink/50">
            {description}
          </p>
        )}
      </div>

      {cta ? (
        <Link
          href={cta.href}
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          {cta.label}
        </Link>
      ) : action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
