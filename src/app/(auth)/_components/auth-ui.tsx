import type { InputHTMLAttributes } from "react";

/**
 * Shared presentational pieces for the auth forms. No hooks — safe to use from
 * both Server and Client Components. Brand tokens + a visible focus ring (the
 * focus outline is never disabled, per CLAUDE.md a11y rule).
 */

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
};

const inputClass =
  "w-full rounded-md border border-[color:var(--lm-hair)] bg-[var(--lm-base)] px-3 py-2 text-sm text-[color:var(--lm-text)] placeholder:text-[color:var(--lm-faint)] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--lm-warm)]";

export function TextField({ label, name, error, ...props }: TextFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
        {label}
      </span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={inputClass}
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-xs" style={{ color: "var(--lm-warm-text)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Alert({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className="rounded-md border px-3 py-2 text-sm"
      style={
        kind === "error"
          ? {
              borderColor: "color-mix(in srgb, var(--lm-warm) 30%, transparent)",
              background: "color-mix(in srgb, var(--lm-warm) 10%, transparent)",
              color: "var(--lm-warm-text)",
            }
          : {
              borderColor: "color-mix(in srgb, var(--lm-sage) 30%, transparent)",
              background: "color-mix(in srgb, var(--lm-sage) 10%, transparent)",
              color: "var(--lm-sage-text)",
            }
      }
    >
      {children}
    </p>
  );
}
