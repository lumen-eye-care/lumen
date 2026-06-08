"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { Field, Textarea, Select, Alert } from "../_components/admin-ui";
import {
  createFrame,
  updateFrame,
  type FrameFormState,
} from "./actions";
import {
  FRAME_SHAPES,
  FRAME_GENDERS,
  FRAME_BADGES,
} from "@/lib/frame-schemas";

type Color = { name: string; hex: string };

export type FrameFormValues = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  stock: number;
  category_id: string | null;
  description: string | null;
  shape: string | null;
  gender: string | null;
  material: string | null;
  badge: string | null;
  colors: Color[];
  photo_urls: string[];
};

const initial: FrameFormState = {};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function FrameForm({
  mode,
  categories,
  frame,
}: {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  frame?: FrameFormValues;
}) {
  const action = mode === "create" ? createFrame : updateFrame;
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  const [name, setName] = useState(frame?.name ?? "");
  const [slug, setSlug] = useState(frame?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [colors, setColors] = useState<Color[]>(frame?.colors ?? []);
  const [keptPhotos, setKeptPhotos] = useState<string[]>(frame?.photo_urls ?? []);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5" noValidate>
      {mode === "edit" && <input type="hidden" name="id" value={frame!.id} />}
      <input type="hidden" name="colors" value={JSON.stringify(colors)} />
      <input
        type="hidden"
        name="existing_photo_urls"
        value={JSON.stringify(keptPhotos)}
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
          hint="Lowercase, hyphenated. Used in the storefront URL."
          error={fe.slug}
          required
        />
        <Field
          label="Price (GHS)"
          name="price_ghs"
          type="number"
          min="0"
          step="0.01"
          defaultValue={frame ? (frame.price_ghs / 100).toFixed(2) : ""}
          hint="Stored as pesewa. e.g. 580 → ₵580.00"
          error={fe.price_ghs}
          required
        />
        <Field
          label="Stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          defaultValue={frame?.stock ?? 0}
          error={fe.stock}
          required
        />
        <Select
          label="Category"
          name="category_id"
          defaultValue={frame?.category_id ?? ""}
          error={fe.category_id}
        >
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          label="Badge"
          name="badge"
          defaultValue={frame?.badge ?? ""}
          error={fe.badge}
        >
          <option value="">— None —</option>
          {FRAME_BADGES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select
          label="Shape"
          name="shape"
          defaultValue={frame?.shape ?? ""}
          error={fe.shape}
        >
          <option value="">— None —</option>
          {FRAME_SHAPES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </Select>
        <Select
          label="Gender"
          name="gender"
          defaultValue={frame?.gender ?? ""}
          error={fe.gender}
        >
          <option value="">— None —</option>
          {FRAME_GENDERS.map((g) => (
            <option key={g} value={g} className="capitalize">
              {g}
            </option>
          ))}
        </Select>
        <Field
          label="Material"
          name="material"
          defaultValue={frame?.material ?? ""}
          hint="e.g. Italian Acetate"
          error={fe.material}
        />
      </div>

      <Textarea
        label="Description"
        name="description"
        defaultValue={frame?.description ?? ""}
        error={fe.description}
      />

      {/* Colours */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-lumen-ink">Colours</legend>
        {fe.colors && <Alert kind="error">{fe.colors}</Alert>}
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="color"
              aria-label={`Colour ${i + 1} swatch`}
              value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000"}
              onChange={(e) =>
                setColors((prev) =>
                  prev.map((p, j) => (j === i ? { ...p, hex: e.target.value } : p)),
                )
              }
              className="h-9 w-12 cursor-pointer rounded border border-lumen-ink/15 bg-white"
            />
            <input
              type="text"
              aria-label={`Colour ${i + 1} name`}
              placeholder="Colour name"
              value={c.name}
              onChange={(e) =>
                setColors((prev) =>
                  prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)),
                )
              }
              className="flex-1 rounded-md border border-lumen-ink/15 bg-white px-3 py-2 text-sm outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue"
            />
            <button
              type="button"
              onClick={() => setColors((prev) => prev.filter((_, j) => j !== i))}
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
            onClick={() => setColors((prev) => [...prev, { name: "", hex: "#1E3148" }])}
          >
            Add colour
          </Button>
        </div>
      </fieldset>

      {/* Photos */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-lumen-ink">Photos</legend>
        {fe.photo_urls && <Alert kind="error">{fe.photo_urls}</Alert>}
        {keptPhotos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {keptPhotos.map((url) => (
              <div
                key={url}
                className="relative h-20 w-20 overflow-hidden rounded-md border border-lumen-ink/10 bg-white"
              >
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() =>
                    setKeptPhotos((prev) => prev.filter((u) => u !== url))
                  }
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-lumen-ink/70 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="text-sm text-lumen-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-lumen-ink/10 file:px-3 file:py-1.5 file:text-sm file:text-lumen-ink"
        />
        <p className="text-xs text-lumen-ink/55">
          JPEG, PNG, WebP or AVIF. Each image up to 5 MB; aim for under 100 KB.
        </p>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create frame"
              : "Save changes"}
        </Button>
        <Link
          href="/admin/frames"
          className="text-sm text-lumen-ink/60 underline-offset-2 hover:text-lumen-ink hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
