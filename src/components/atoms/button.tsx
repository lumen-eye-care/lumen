import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

const variantClasses: Record<Variant, string> = {
  primary: "bg-lumen-blue text-lumen-cream hover:bg-lumen-ink",
  secondary:
    "bg-lumen-cream text-lumen-ink border border-lumen-ink/15 hover:border-lumen-ink/40",
  tertiary: "bg-transparent text-lumen-blue hover:underline",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/**
 * Reference atom showing the brand-token + variant pattern. The rest of the
 * component inventory (CLAUDE.md / Handoff §5) is built in Sprint 1.
 */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
