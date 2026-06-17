"use client";

/**
 * Interactive PDP island (US-P0-02 + US-P2-02 lens builder). The server page
 * passes a serializable ShopFrame, the lens catalogue, the prescription flag, and
 * the signed-in user's on-file prescriptions. This component owns colour + lens
 * build + prescription selection, then builds a cart line.
 *
 * Prices shown are a display snapshot; checkout always re-prices from the DB.
 * If the lens catalogue is empty (not yet seeded), it degrades to a frame-only
 * "Add to bag" so the PDP keeps working.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon, type IconName } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import { LUMEN_WHATSAPP_E164 } from "@/lib/contact";
import { waMeUrl } from "@/lib/wa-link";
import { frameToCartItem, buildLensCartItem, type CartLens } from "@/lib/cart";
import { lensUnitPesewa, type LensCatalogueView } from "@/lib/lens-catalogue";
import type { RxMethod } from "@/lib/checkout-schemas";
import type { ShopFrame } from "@/server/frames";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/atoms/toast";

const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Best seller",
  NEW: "New",
  LIMITED: "Limited edition",
};

/** Minimal on-file prescription, as passed from the server (no Rx values). */
export type OnFilePrescription = {
  id: string;
  status: string;
  createdAt: string;
  practitionerName: string | null;
};

export type FramePurchasePanelProps = {
  frame: ShopFrame;
  catalogue: LensCatalogueView;
  prescriptionUploadEnabled: boolean;
  onFilePrescriptions: OnFilePrescription[];
};

const sectionLabel =
  "mb-2 text-xs font-medium uppercase tracking-wider text-[color:var(--lm-faint)]";

export function FramePurchasePanel({
  frame,
  catalogue,
  prescriptionUploadEnabled,
  onFilePrescriptions,
}: FramePurchasePanelProps) {
  const { add, open } = useCart();
  const { toast } = useToast();

  const hasBuilder = catalogue.lensTypes.length > 0;

  const [colorIndex, setColorIndex] = useState(0);
  const [lensTypeSlug, setLensTypeSlug] = useState<string>(
    () => catalogue.lensTypes[0]?.slug ?? "",
  );
  // Included add-ons are always-on (price 0); pre-select them.
  const [addonSlugs, setAddonSlugs] = useState<Set<string>>(
    () => new Set(catalogue.addons.filter((a) => a.included).map((a) => a.slug)),
  );
  const [rxMethod, setRxMethod] = useState<RxMethod | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);

  const color = frame.colors[colorIndex] ?? null;
  const primaryPhoto = frame.photo_urls[0] ?? null;
  const outOfStock = frame.stock <= 0;
  const meta = [frame.material, frame.category?.name].filter(Boolean).join(" · ");

  const lensUnit = useMemo(
    () => (hasBuilder ? lensUnitPesewa(catalogue, lensTypeSlug, addonSlugs) : 0),
    [hasBuilder, catalogue, lensTypeSlug, addonSlugs],
  );
  const total = frame.price_ghs + lensUnit;

  function toggleAddon(slug: string, included: boolean) {
    if (included) return; // included add-ons are locked on
    setAddonSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  // Rx is required to add (mockup's canAdd = !!rx); onfile also needs a selection.
  const rxChosen =
    rxMethod === "later" || (rxMethod === "onfile" && !!prescriptionId);
  const canAdd = !outOfStock && !!color && (!hasBuilder || (!!lensTypeSlug && rxChosen));

  function handleAddToBag() {
    if (!canAdd) return;

    let item;
    if (!hasBuilder) {
      item = frameToCartItem(frame, colorIndex);
    } else {
      const type = catalogue.lensTypes.find((t) => t.slug === lensTypeSlug);
      const chosenAddons = catalogue.addons.filter((a) => addonSlugs.has(a.slug));
      const lens: CartLens = {
        lensTypeSlug,
        lensTypeName: type?.name ?? null,
        lensUnitPricePesewa: lensUnit,
        addonSlugs: chosenAddons.map((a) => a.slug),
        addonNames: chosenAddons.map((a) => a.name),
        rxMethod,
        prescriptionId: rxMethod === "onfile" ? prescriptionId : null,
      };
      item = buildLensCartItem(frame, colorIndex, lens);
    }

    if (!item) return;
    add(item);
    toast(`${frame.name}${color ? ` · ${color.name}` : ""} added to your bag.`);
    open();
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Gallery */}
      <div className="flex flex-col gap-4">
        <div
          className="relative flex items-center justify-center rounded-2xl px-10 py-12"
          style={{ background: "var(--lm-deep)" }}
        >
          {frame.badge && (
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: "color-mix(in srgb, var(--lm-blue) 12%, transparent)",
                color: "var(--lm-blue)",
              }}
            >
              {BADGE_LABEL[frame.badge] ?? frame.badge}
            </span>
          )}
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={`${frame.name} frames`}
              width={480}
              height={320}
              className="h-auto w-full max-w-sm object-contain"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
          ) : (
            <FrameSVG
              shape={frame.shape}
              color={color?.hex ?? "var(--lm-text)"}
              className="w-full max-w-sm"
            />
          )}
        </div>

        {/* Colour thumbnails */}
        {frame.colors.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {frame.colors.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColorIndex(i)}
                aria-label={`View ${c.name}`}
                aria-pressed={i === colorIndex}
                className="flex h-16 w-16 items-center justify-center rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                style={{
                  background: "var(--lm-deep)",
                  boxShadow:
                    i === colorIndex
                      ? "0 0 0 2px var(--lm-warm)"
                      : "0 0 0 1px var(--lm-hair)",
                }}
              >
                <FrameSVG shape={frame.shape} color={c.hex} className="w-[78%]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info + builder */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="lm-display text-4xl" style={{ color: "var(--lm-text)" }}>
            {frame.name}
          </h1>
          {meta && (
            <p className="mt-1 text-sm" style={{ color: "var(--lm-faint)" }}>
              {meta}
            </p>
          )}
        </div>

        <div>
          <p className="text-3xl font-medium" style={{ color: "var(--lm-warm)" }}>
            {formatGhs(total)}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--lm-faint)" }}>
            {hasBuilder
              ? lensUnit > 0
                ? `Frame ${formatGhs(frame.price_ghs)} + lenses ${formatGhs(lensUnit)}`
                : "Frame + lenses included"
              : "Frame only · Lenses added at checkout"}
          </p>
        </div>

        {/* Colour selector */}
        {frame.colors.length > 0 && (
          <div>
            <p className={sectionLabel}>
              Colour
              {color ? (
                <span style={{ color: "var(--lm-muted)" }}> · {color.name}</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {frame.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setColorIndex(i)}
                  aria-label={c.name}
                  aria-pressed={i === colorIndex}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow:
                      i === colorIndex
                        ? "0 0 0 2px var(--lm-warm), 0 0 0 4px var(--lm-base)"
                        : "0 0 0 1px var(--lm-hair)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lens builder */}
        {hasBuilder && (
          <>
            {/* Lens type */}
            <div>
              <p className={sectionLabel}>Lens type</p>
              <div className="flex flex-col gap-2">
                {catalogue.lensTypes.map((t) => {
                  const selected = t.slug === lensTypeSlug;
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => setLensTypeSlug(t.slug)}
                      aria-pressed={selected}
                      className="flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                      style={{
                        border: `1px solid ${selected ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                        background: selected ? "var(--lm-tint)" : "transparent",
                      }}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                            {t.name}
                          </span>
                          {t.badge && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{
                                background: "color-mix(in srgb, var(--lm-sage) 16%, transparent)",
                                color: "var(--lm-sage)",
                              }}
                            >
                              {t.badge}
                            </span>
                          )}
                        </span>
                        {t.description && (
                          <span className="mt-0.5 block text-xs" style={{ color: "var(--lm-faint)" }}>
                            {t.description}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
                        {t.price_ghs > 0 ? `+ ${formatGhs(t.price_ghs)}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons */}
            {catalogue.addons.length > 0 && (
              <div>
                <p className={sectionLabel}>Add-ons</p>
                <div className="flex flex-col gap-2">
                  {catalogue.addons.map((a) => {
                    const checked = addonSlugs.has(a.slug);
                    return (
                      <label
                        key={a.slug}
                        className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-4 py-3 transition-all"
                        style={{
                          border: `1px solid ${checked ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                          background: checked ? "var(--lm-tint)" : "transparent",
                          cursor: a.included ? "default" : "pointer",
                        }}
                      >
                        <span className="flex min-w-0 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={a.included}
                            onChange={() => toggleAddon(a.slug, a.included)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--lm-warm)]"
                          />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                                {a.name}
                              </span>
                              {a.included && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--lm-sage)" }}>
                                  Included
                                </span>
                              )}
                            </span>
                            {a.description && (
                              <span className="mt-0.5 block text-xs" style={{ color: "var(--lm-faint)" }}>
                                {a.description}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
                          {a.price_ghs > 0 ? `+ ${formatGhs(a.price_ghs)}` : "Free"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prescription */}
            <div>
              <p className={sectionLabel}>Prescription</p>
              <div className="flex flex-col gap-2">
                <RxOption
                  active={rxMethod === "later"}
                  onClick={() => {
                    setRxMethod("later");
                    setPrescriptionId(null);
                  }}
                  icon="clock"
                  title="Send it later"
                  desc="We'll email you a reminder to share your prescription."
                />

                {prescriptionUploadEnabled && onFilePrescriptions.length > 0 && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      border: `1px solid ${rxMethod === "onfile" ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                      background: rxMethod === "onfile" ? "var(--lm-tint)" : "transparent",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setRxMethod("onfile")}
                      aria-pressed={rxMethod === "onfile"}
                      className="flex w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                    >
                      <Icon name="eye" size={16} className="shrink-0 text-[color:var(--lm-warm)]" />
                      <span>
                        <span className="block text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                          Use a prescription on file
                        </span>
                        <span className="block text-xs" style={{ color: "var(--lm-faint)" }}>
                          Choose one you&apos;ve already shared with us.
                        </span>
                      </span>
                    </button>
                    {rxMethod === "onfile" && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {onFilePrescriptions.map((p) => (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                            style={{ color: "var(--lm-muted)" }}
                          >
                            <input
                              type="radio"
                              name="onfile-rx"
                              checked={prescriptionId === p.id}
                              onChange={() => setPrescriptionId(p.id)}
                              className="h-4 w-4 accent-[color:var(--lm-warm)]"
                            />
                            {onFileLabel(p)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {prescriptionUploadEnabled && (
                  <p className="px-1 text-xs" style={{ color: "var(--lm-faint)" }}>
                    Need to add a new prescription?{" "}
                    <Link
                      href="/account/prescriptions"
                      className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                      style={{ color: "var(--lm-warm)" }}
                    >
                      Upload or enter it in your account
                    </Link>
                    , then come back and select it here.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-2 text-sm">
          {frame.stock > 5 ? (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-sage)" }} />
              <span style={{ color: "var(--lm-sage)" }}>In stock</span>
            </>
          ) : frame.stock > 0 ? (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-warm)" }} />
              <span style={{ color: "var(--lm-warm)" }}>Only {frame.stock} left</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-faint)" }} />
              <span style={{ color: "var(--lm-faint)" }}>Out of stock</span>
            </>
          )}
        </div>

        {/* Add to bag */}
        <button
          type="button"
          onClick={handleAddToBag}
          disabled={!canAdd}
          className="lm-pill w-full justify-center py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? (
            "Out of stock"
          ) : hasBuilder && !rxChosen ? (
            "Choose a prescription option"
          ) : (
            <>
              Add to bag · {formatGhs(total)} <Icon name="arrow" size={16} />
            </>
          )}
        </button>

        {!hasBuilder && (
          <div
            className="rounded-xl px-5 py-4"
            style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-tint)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
              Lens options coming soon
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--lm-muted)" }}>
              Choose your lens type and add-ons at checkout. Questions? WhatsApp us at{" "}
              <a
                href={waMeUrl(LUMEN_WHATSAPP_E164)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                style={{ color: "var(--lm-warm)" }}
              >
                +233 24 562 8432
              </a>
              .
            </p>
          </div>
        )}

        {frame.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--lm-muted)" }}>
            {frame.description}
          </p>
        )}
      </div>
    </div>
  );
}

/** A single Rx method choice (radio-like card). */
function RxOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
      style={{
        border: `1px solid ${active ? "var(--lm-warm)" : "var(--lm-hair)"}`,
        background: active ? "var(--lm-tint)" : "transparent",
      }}
    >
      <Icon name={icon} size={16} className="shrink-0 text-[color:var(--lm-warm)]" />
      <span>
        <span className="block text-sm font-medium" style={{ color: "var(--lm-text)" }}>
          {title}
        </span>
        <span className="block text-xs" style={{ color: "var(--lm-faint)" }}>
          {desc}
        </span>
      </span>
    </button>
  );
}

/** Human label for an on-file prescription option. */
function onFileLabel(p: OnFilePrescription): string {
  const when = new Date(p.createdAt).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const status = p.status.charAt(0).toUpperCase() + p.status.slice(1);
  const who = p.practitionerName ? ` · ${p.practitionerName}` : "";
  return `Shared ${when}${who} · ${status}`;
}
