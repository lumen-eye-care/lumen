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

export function TextField({ label, name, error, ...props }: TextFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-lumen-ink">{label}</span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className="rounded-md border border-lumen-ink/15 bg-white px-3 py-2 text-sm text-lumen-ink outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue"
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-xs text-lumen-warm">
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
  const styles =
    kind === "error"
      ? "border-lumen-warm/30 bg-lumen-warm/10 text-lumen-warm"
      : "border-lumen-sage/30 bg-lumen-sage/10 text-lumen-sage";
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </p>
  );
}
