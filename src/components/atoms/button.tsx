import type { ButtonHTMLAttributes } from "react";
import type { CSSProperties } from "react";

type Variant = "primary" | "secondary" | "tertiary";

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--lm-warm)",
    color: "#1a0f0a",
  },
  secondary: {
    background: "var(--lm-raise)",
    color: "var(--lm-text)",
    border: "1px solid var(--lm-hair)",
  },
  tertiary: {
    background: "transparent",
    color: "var(--lm-warm)",
  },
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/**
 * Reference atom — variant pattern using --lm-* theme vars.
 */
export function Button({
  variant = "primary",
  className = "",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}
