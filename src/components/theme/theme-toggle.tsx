"use client";

import { Icon } from "@/components/atoms/icon";
import { useTheme } from "./theme-provider";

/**
 * Sun/moon theme switch. `theme` comes from useSyncExternalStore, so it reads
 * correct after mount without a setState-in-effect — server renders the light
 * (moon) icon and the client re-reads the real value on hydration.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
        "text-[color:var(--lm-muted)] hover:bg-[color:var(--lm-tint)] hover:text-[color:var(--lm-text)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon name={isDark ? "sun" : "moon"} size={18} />
    </button>
  );
}
