"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/atoms/icon";
import { uploadPrescription, type PrescriptionFormState } from "./actions";

const inputClass =
  "w-full rounded-md border border-[color:var(--lm-hair)] bg-[var(--lm-raise)] px-3 py-2.5 text-sm text-[color:var(--lm-text)] placeholder:text-[color:var(--lm-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]";
const errorClass = "mt-1 text-xs text-[color:var(--lm-warm)]";
const labelText = "mb-1.5 block font-medium text-[color:var(--lm-text)]";
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export function PrescriptionForm() {
  const [state, action, pending] = useActionState<PrescriptionFormState, FormData>(
    uploadPrescription,
    { status: "idle" },
  );
  // Consent gates the file input + submit — the server re-checks it too.
  const [consent, setConsent] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  // Remount the form after a success so fields/file clear.
  const [formKey, setFormKey] = useState(0);

  if (state.status === "success") {
    return (
      <div
        className="lm-card px-6 py-8 text-center"
        style={{ borderColor: "color-mix(in srgb, var(--lm-sage) 40%, transparent)" }}
      >
        <span
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--lm-sage) 18%, transparent)",
            color: "var(--lm-sage)",
          }}
        >
          <Icon name="check" size={20} />
        </span>
        <h2 className="lm-display mb-2 text-2xl">Prescription uploaded</h2>
        <p className="mx-auto max-w-sm text-sm" style={{ color: "var(--lm-muted)" }}>
          Our team will review it and update its status. It now appears in your list below.
        </p>
        <button
          type="button"
          onClick={() => {
            setConsent(false);
            setFileName(null);
            setFormKey((k) => k + 1);
          }}
          className="lm-ghost mt-5 px-4 py-2 text-sm"
        >
          Upload another
        </button>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const formError = state.status === "error" ? state.error : null;

  return (
    <form key={formKey} action={action} className="lm-card space-y-5 p-6" noValidate>
      {/* Consent gate */}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--lm-blue)]"
          aria-describedby="consent-hint"
        />
        <span style={{ color: "var(--lm-muted)" }}>
          I confirm this is my own prescription from a certified eye-care practitioner,
          and I consent to Lumen Eye Care securely storing it to process my order.
          <span id="consent-hint" className="mt-1 block text-xs" style={{ color: "var(--lm-faint)" }}>
            You can ask us to delete it at any time.
          </span>
        </span>
      </label>
      {fieldErrors.consent && <p className={errorClass}>{fieldErrors.consent}</p>}

      {/* File */}
      <label className="block text-sm">
        <span className={labelText}>Prescription file</span>
        <input
          type="file"
          name="file"
          accept={ACCEPT}
          required
          disabled={!consent}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[var(--lm-tint)] file:px-3 file:py-1.5 file:text-sm file:text-[color:var(--lm-text)] disabled:cursor-not-allowed disabled:opacity-50`}
          aria-invalid={!!fieldErrors.file}
          aria-describedby={fieldErrors.file ? "file-error" : "file-hint"}
        />
        <p id="file-hint" className="mt-1 text-xs" style={{ color: "var(--lm-faint)" }}>
          JPG, PNG, WebP or PDF · up to 5 MB.{fileName ? ` Selected: ${fileName}` : ""}
        </p>
        {fieldErrors.file && (
          <p id="file-error" className={errorClass}>
            {fieldErrors.file}
          </p>
        )}
      </label>

      {/* Practitioner (optional) */}
      <label className="block text-sm">
        <span className={labelText}>
          Practitioner or clinic{" "}
          <span className="font-normal" style={{ color: "var(--lm-faint)" }}>(optional)</span>
        </span>
        <input
          name="practitioner_name"
          type="text"
          disabled={!consent}
          placeholder="e.g. Dr. Ama Owusu, Korle Bu Eye Centre"
          className={`${inputClass} disabled:opacity-50`}
          aria-invalid={!!fieldErrors.practitioner_name}
        />
        {fieldErrors.practitioner_name && (
          <p className={errorClass}>{fieldErrors.practitioner_name}</p>
        )}
      </label>

      {/* Issued on (optional) */}
      <label className="block text-sm">
        <span className={labelText}>
          Date issued{" "}
          <span className="font-normal" style={{ color: "var(--lm-faint)" }}>(optional)</span>
        </span>
        <input
          name="issued_on"
          type="date"
          disabled={!consent}
          className={`${inputClass} disabled:opacity-50`}
          aria-invalid={!!fieldErrors.issued_on}
          aria-describedby={fieldErrors.issued_on ? "issued_on-error" : "issued_on-hint"}
        />
        <p id="issued_on-hint" className="mt-1 text-xs" style={{ color: "var(--lm-faint)" }}>
          Prescriptions are usually valid for about 12 months.
        </p>
        {fieldErrors.issued_on && (
          <p id="issued_on-error" className={errorClass}>
            {fieldErrors.issued_on}
          </p>
        )}
      </label>

      {/* Notes (optional) */}
      <label className="block text-sm">
        <span className={labelText}>
          Anything we should know?{" "}
          <span className="font-normal" style={{ color: "var(--lm-faint)" }}>(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          disabled={!consent}
          placeholder="e.g. This is for reading glasses only."
          className={`${inputClass} min-h-20 resize-y disabled:opacity-50`}
          aria-invalid={!!fieldErrors.notes}
        />
        {fieldErrors.notes && <p className={errorClass}>{fieldErrors.notes}</p>}
      </label>

      {formError && (
        <p
          role="alert"
          className="rounded-md px-3 py-2.5 text-sm"
          style={{
            background: "color-mix(in srgb, var(--lm-warm) 12%, transparent)",
            color: "var(--lm-warm)",
          }}
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !consent}
        className="lm-pill w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload prescription"}
        {!pending && <Icon name="arrow" size={14} />}
      </button>
    </form>
  );
}
