import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

/**
 * Shared presentational pieces for the admin surface. No hooks — safe in Server
 * and Client Components. Utilitarian layout on the brand tokens (Handoff §4).
 * The focus outline is never disabled (CLAUDE.md a11y rule).
 */

const fieldInputClass =
  "rounded-md border border-lumen-ink/15 bg-white px-3 py-2 text-sm text-lumen-ink outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue disabled:opacity-50";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-lumen-ink">{title}</h1>
        {description ? (
          <p className="text-sm text-lumen-ink/70">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function Field({ label, name, error, hint, ...props }: FieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-lumen-ink">{label}</span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? hintId}
        className={fieldInputClass}
        {...props}
      />
      {hint && !error ? (
        <span id={hintId} className="text-xs text-lumen-ink/55">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs text-lumen-warm">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
};

export function Textarea({ label, name, error, ...props }: TextareaProps) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-lumen-ink">{label}</span>
      <textarea
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`${fieldInputClass} min-h-24 resize-y`}
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

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
};

export function Select({ label, name, error, children, ...props }: SelectProps) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-lumen-ink">{label}</span>
      <select
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={fieldInputClass}
        {...props}
      >
        {children}
      </select>
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
  children: ReactNode;
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

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-lumen-ink/10 bg-white">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-lumen-ink/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b border-lumen-ink/5 px-4 py-3 align-middle text-lumen-ink/60 ${className}`}
    >
      {children}
    </td>
  );
}

/** Order/frame status pill. Sage = good/terminal, blue = in-flight, warm = needs attention, grey = neutral. */
export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    // orders
    pending: "bg-lumen-ink/8 text-lumen-ink/70",
    paid: "bg-lumen-blue/12 text-lumen-blue",
    cod_pending: "bg-lumen-warm/12 text-lumen-warm",
    cod_collected: "bg-lumen-blue/12 text-lumen-blue",
    shipped: "bg-lumen-blue/12 text-lumen-blue",
    delivered: "bg-lumen-sage/15 text-lumen-sage",
    failed: "bg-lumen-warm/15 text-lumen-warm",
    failed_timeout: "bg-lumen-warm/15 text-lumen-warm",
    refunded: "bg-lumen-ink/8 text-lumen-ink/70",
    // frames
    active: "bg-lumen-sage/15 text-lumen-sage",
    archived: "bg-lumen-ink/8 text-lumen-ink/60",
    // prescriptions
    verified: "bg-lumen-sage/15 text-lumen-sage",
    rejected: "bg-lumen-warm/15 text-lumen-warm",
  };
  const cls = tone[status] ?? "bg-lumen-ink/8 text-lumen-ink/70";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
