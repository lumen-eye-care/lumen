"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { Field, Alert } from "../_components/admin-ui";
import {
  createLensType,
  updateLensType,
  createLensAddon,
  updateLensAddon,
  type LensFormState,
} from "./actions";

export type LensKind = "type" | "addon";

export type LensFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_ghs: number; // integer pesewa
  sort_order: number;
  is_active: boolean;
  badge?: string | null; // type only
  included?: boolean; // addon only
};

const initial: LensFormState = {};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const KIND_LABEL: Record<LensKind, string> = { type: "lens type", addon: "add-on" };

export function LensForm({
  kind,
  mode,
  values,
}: {
  kind: LensKind;
  mode: "create" | "edit";
  values?: LensFormValues;
}) {
  const action =
    kind === "type"
      ? mode === "create"
        ? createLensType
        : updateLensType
      : mode === "create"
        ? createLensAddon
        : updateLensAddon;

  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  const [name, setName] = useState(values?.name ?? "");
  const [slug, setSlug] = useState(values?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const priceGhs =
    values?.price_ghs != null ? (values.price_ghs / 100).toString() : "0";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5" noValidate>
      {mode === "edit" && <input type="hidden" name="id" value={values!.id} />}

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
          hint="Lowercase, hyphenated. Stable identifier used on the order."
          error={fe.slug}
          required
        />
        <div className="sm:col-span-2">
          <Field
            label="Description"
            name="description"
            defaultValue={values?.description ?? ""}
            hint="Short helper line shown under the option in the builder."
            error={fe.description}
          />
        </div>
        <Field
          label="Price (GHS)"
          name="price_ghs"
          type="number"
          min="0"
          step="0.01"
          defaultValue={priceGhs}
          hint="Surcharge over the frame. Enter 0 for an included option."
          error={fe.price_ghs}
          required
        />
        <Field
          label="Sort order"
          name="sort_order"
          type="number"
          min="0"
          step="1"
          defaultValue={values?.sort_order ?? 0}
          hint="Lower numbers appear first."
          error={fe.sort_order}
        />
        {kind === "type" && (
          <div className="sm:col-span-2">
            <Field
              label="Badge"
              name="badge"
              defaultValue={values?.badge ?? ""}
              hint="Optional, e.g. “Most popular” or “Recommended”."
              error={fe.badge}
            />
          </div>
        )}
      </div>

      {kind === "addon" && (
        <label className="flex items-center gap-2.5 text-sm text-lumen-ink">
          <input
            type="checkbox"
            name="included"
            defaultChecked={values?.included ?? false}
            className="h-4 w-4 accent-lumen-blue"
          />
          Included by default (always-on, shown with an “Included” badge)
        </label>
      )}

      <label className="flex items-center gap-2.5 text-sm text-lumen-ink">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={values?.is_active ?? true}
          className="h-4 w-4 accent-lumen-blue"
        />
        Active (visible in the lens builder)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? `Create ${KIND_LABEL[kind]}`
              : "Save changes"}
        </Button>
        <Link
          href="/admin/lenses"
          className="text-sm text-lumen-ink/60 underline-offset-2 hover:text-lumen-ink hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
