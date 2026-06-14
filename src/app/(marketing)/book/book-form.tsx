"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/atoms/icon";
import {
  APPOINTMENT_SERVICES,
  SERVICE_LABELS,
  type AppointmentService,
} from "@/lib/appointment-schemas";
import { requestAppointment, type BookFormState } from "./actions";

const inputClass =
  "w-full rounded-md border border-[color:var(--lm-hair)] bg-[var(--lm-raise)] px-3 py-2.5 text-sm text-[color:var(--lm-text)] placeholder:text-[color:var(--lm-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]";

const errorClass = "mt-1 text-xs text-[color:var(--lm-warm)]";

type Clinic = { id: string; name: string };

type BookFormProps = {
  clinics: Clinic[];
  defaultClinicId: string;
  defaultService: AppointmentService;
};

export function BookForm({
  clinics,
  defaultClinicId,
  defaultService,
}: BookFormProps) {
  const [state, action, pending] = useActionState<BookFormState, FormData>(
    requestAppointment,
    { status: "idle" },
  );

  const [selectedClinicId, setSelectedClinicId] = useState(defaultClinicId);
  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) ?? clinics[0];

  if (state.status === "success") {
    return (
      <div
        className="lm-card px-6 py-8 text-center"
        style={{ borderColor: "color-mix(in srgb, var(--lm-sage) 40%, transparent)" }}
      >
        <span
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--lm-sage) 18%, transparent)", color: "var(--lm-sage)" }}
        >
          <Icon name="check" size={20} />
        </span>
        <h2 className="lm-display mb-2 text-2xl">Request received</h2>
        <p className="mx-auto max-w-sm text-sm" style={{ color: "var(--lm-muted)" }}>
          We&apos;ve sent a confirmation to your email. Our team will be in
          touch shortly to confirm your appointment.
        </p>
      </div>
    );
  }

  const fieldErrors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const formError = state.status === "error" ? state.error : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Hidden fields carry validated clinic data to the server action. */}
      <input type="hidden" name="clinic_id" value={selectedClinicId} />
      <input type="hidden" name="clinic_name" value={selectedClinic?.name ?? ""} />

      {/* Service */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          What can we help you with?
        </span>
        <select
          name="service"
          defaultValue={defaultService}
          className={inputClass}
          aria-invalid={!!fieldErrors.service}
          aria-describedby={fieldErrors.service ? "service-error" : undefined}
        >
          {APPOINTMENT_SERVICES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_LABELS[s]}
            </option>
          ))}
        </select>
        {fieldErrors.service && (
          <p id="service-error" className={errorClass}>
            {fieldErrors.service}
          </p>
        )}
      </label>

      {/* Clinic selector — shown when more than one clinic is available */}
      {clinics.length > 1 && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">Clinic</span>
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className={inputClass}
            aria-invalid={!!fieldErrors.clinic_id}
            aria-describedby={
              fieldErrors.clinic_id ? "clinic_id-error" : undefined
            }
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors.clinic_id && (
            <p id="clinic_id-error" className={errorClass}>
              {fieldErrors.clinic_id}
            </p>
          )}
        </label>
      )}

      {/* Name */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Your name
        </span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Ama Owusu"
          className={inputClass}
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className={errorClass}>
            {fieldErrors.name}
          </p>
        )}
      </label>

      {/* Phone */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Phone number
        </span>
        <input
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="024 123 4567"
          className={inputClass}
          aria-invalid={!!fieldErrors.phone}
          aria-describedby={fieldErrors.phone ? "phone-error" : "phone-hint"}
        />
        <p id="phone-hint" className="mt-1 text-xs text-[color:var(--lm-faint)]">
          Ghana number. We&apos;ll call to confirm.
        </p>
        {fieldErrors.phone && (
          <p id="phone-error" className={errorClass}>
            {fieldErrors.phone}
          </p>
        )}
      </label>

      {/* Email */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Email address
        </span>
        <input
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : "email-hint"}
        />
        <p id="email-hint" className="mt-1 text-xs text-[color:var(--lm-faint)]">
          For your confirmation email.
        </p>
        {fieldErrors.email && (
          <p id="email-error" className={errorClass}>
            {fieldErrors.email}
          </p>
        )}
      </label>

      {/* Preferred date (optional) */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Preferred date{" "}
          <span className="font-normal text-[color:var(--lm-faint)]">(optional)</span>
        </span>
        <input
          name="preferred_date"
          type="date"
          className={inputClass}
          aria-invalid={!!fieldErrors.preferred_date}
          aria-describedby={
            fieldErrors.preferred_date ? "preferred_date-error" : undefined
          }
        />
        {fieldErrors.preferred_date && (
          <p id="preferred_date-error" className={errorClass}>
            {fieldErrors.preferred_date}
          </p>
        )}
      </label>

      {/* Notes (optional) */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Anything else we should know?{" "}
          <span className="font-normal text-[color:var(--lm-faint)]">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="e.g. I wear reading glasses; I'm coming with my child"
          className={`${inputClass} min-h-20 resize-y`}
          aria-invalid={!!fieldErrors.notes}
          aria-describedby={fieldErrors.notes ? "notes-error" : undefined}
        />
        {fieldErrors.notes && (
          <p id="notes-error" className={errorClass}>
            {fieldErrors.notes}
          </p>
        )}
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
        disabled={pending}
        className="lm-pill w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request appointment"}
        {!pending && <Icon name="arrow" size={14} />}
      </button>
    </form>
  );
}
