"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { Field, Alert } from "../_components/admin-ui";
import {
  createClinic,
  updateClinic,
  type ClinicFormState,
} from "./actions";
import {
  DAY_KEYS,
  type DayKey,
  type OpeningHours,
} from "@/lib/clinic-hours";

export type ClinicFormValues = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  optometrist_count: number;
  services: string[];
  opening_hours: OpeningHours | null;
  is_flagship: boolean;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
};

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DEFAULT_HOURS: OpeningHours = {
  mon: { open: "08:00", close: "19:00", closed: false },
  tue: { open: "08:00", close: "19:00", closed: false },
  wed: { open: "08:00", close: "19:00", closed: false },
  thu: { open: "08:00", close: "19:00", closed: false },
  fri: { open: "08:00", close: "19:00", closed: false },
  sat: { open: "09:00", close: "18:00", closed: false },
  sun: { open: null, close: null, closed: true },
};

const initial: ClinicFormState = {};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ClinicForm({
  mode,
  clinic,
}: {
  mode: "create" | "edit";
  clinic?: ClinicFormValues;
}) {
  const action = mode === "create" ? createClinic : updateClinic;
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  const [name, setName] = useState(clinic?.name ?? "");
  const [slug, setSlug] = useState(clinic?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [services, setServices] = useState<string[]>(clinic?.services ?? []);
  const [hours, setHours] = useState<OpeningHours>(
    clinic?.opening_hours ?? DEFAULT_HOURS,
  );

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function setDay(key: DayKey, patch: Partial<OpeningHours[DayKey]>) {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5" noValidate>
      {mode === "edit" && <input type="hidden" name="id" value={clinic!.id} />}
      <input type="hidden" name="services" value={JSON.stringify(services)} />
      <input
        type="hidden"
        name="opening_hours"
        value={JSON.stringify(hours)}
      />

      {state.error && <Alert kind="error">{state.error}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={fe.name}
          required
        />
        <Field
          label="Slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          hint="Lowercase, hyphenated. Stable identifier for the clinic."
          error={fe.slug}
          required
        />
        <div className="sm:col-span-2">
          <Field
            label="Address"
            name="address"
            defaultValue={clinic?.address ?? ""}
            hint="End with the city — it drives the storefront copy, e.g. “…, Accra”."
            error={fe.address}
            required
          />
        </div>
        <Field
          label="Phone"
          name="phone"
          type="tel"
          defaultValue={clinic?.phone ?? ""}
          hint="Ghana number; 0XX… or +233… both work."
          error={fe.phone}
        />
        <Field
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          defaultValue={clinic?.whatsapp ?? ""}
          hint="Used for the Book/Chat buttons on /clinics."
          error={fe.whatsapp}
        />
        <Field
          label="Optometrists on staff"
          name="optometrist_count"
          type="number"
          min="0"
          step="1"
          defaultValue={clinic?.optometrist_count ?? 0}
          error={fe.optometrist_count}
          required
        />
        <Field
          label="Sort order"
          name="sort_order"
          type="number"
          min="0"
          step="1"
          defaultValue={clinic?.sort_order ?? 0}
          hint="Lower numbers appear first."
          error={fe.sort_order}
        />
        <Field
          label="Latitude"
          name="latitude"
          type="number"
          step="any"
          defaultValue={clinic?.latitude ?? ""}
          hint="Optional, for a future map embed."
          error={fe.latitude}
        />
        <Field
          label="Longitude"
          name="longitude"
          type="number"
          step="any"
          defaultValue={clinic?.longitude ?? ""}
          error={fe.longitude}
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-lumen-ink">
        <input
          type="checkbox"
          name="is_flagship"
          defaultChecked={clinic?.is_flagship ?? false}
          className="h-4 w-4 accent-lumen-blue"
        />
        Flagship clinic
      </label>

      {/* Opening hours */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-lumen-ink">
          Opening hours
        </legend>
        {fe.opening_hours && <Alert kind="error">{fe.opening_hours}</Alert>}
        {DAY_KEYS.map((key) => {
          const day = hours[key];
          return (
            <div
              key={key}
              className="grid grid-cols-[6.5rem_auto_1fr_1fr] items-center gap-3"
            >
              <span className="text-sm text-lumen-ink/80">
                {DAY_LABELS[key]}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-lumen-ink/60">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => setDay(key, { closed: e.target.checked })}
                  className="h-3.5 w-3.5 accent-lumen-blue"
                />
                Closed
              </label>
              <input
                type="time"
                aria-label={`${DAY_LABELS[key]} opening time`}
                value={day.open ?? ""}
                disabled={day.closed}
                onChange={(e) =>
                  setDay(key, { open: e.target.value || null })
                }
                className="rounded-md border border-lumen-ink/15 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue disabled:opacity-40"
              />
              <input
                type="time"
                aria-label={`${DAY_LABELS[key]} closing time`}
                value={day.close ?? ""}
                disabled={day.closed}
                onChange={(e) =>
                  setDay(key, { close: e.target.value || null })
                }
                className="rounded-md border border-lumen-ink/15 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue disabled:opacity-40"
              />
            </div>
          );
        })}
      </fieldset>

      {/* Services */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-lumen-ink">Services</legend>
        {fe.services && <Alert kind="error">{fe.services}</Alert>}
        {services.map((service, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="text"
              aria-label={`Service ${i + 1}`}
              placeholder="e.g. Eye tests"
              value={service}
              onChange={(e) =>
                setServices((prev) =>
                  prev.map((s, j) => (j === i ? e.target.value : s)),
                )
              }
              className="flex-1 rounded-md border border-lumen-ink/15 bg-white px-3 py-2 text-sm outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue"
            />
            <button
              type="button"
              onClick={() =>
                setServices((prev) => prev.filter((_, j) => j !== i))
              }
              className="text-sm text-lumen-warm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              Remove
            </button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setServices((prev) => [...prev, ""])}
          >
            Add service
          </Button>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create clinic"
              : "Save changes"}
        </Button>
        <Link
          href="/admin/clinics"
          className="text-sm text-lumen-ink/60 underline-offset-2 hover:text-lumen-ink hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
