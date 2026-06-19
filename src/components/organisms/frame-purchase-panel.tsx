"use client";

/**
 * Interactive PDP island (US-P0-02 + US-P2-02 lens builder, accordion rebuild).
 * The server page passes a serializable ShopFrame, the lens catalogue, the
 * prescription flag, and the signed-in user's on-file prescriptions. This
 * component owns colour + lens build + prescription selection, then builds a
 * cart line.
 *
 * Builder UX mirrors docs/design/frame-detail.jsx (.builder-step / .pdp-bag),
 * themed to --lm-*: a guided accordion (one step open at a time, numbered →
 * ticked, collapsed summary, auto-advance) + a sticky total/CTA bar. Add-ons are
 * grouped (coatings · sun/tint · lens-thickness radio).
 *
 * Prices shown are a display snapshot; checkout always re-prices from the DB. If
 * the lens catalogue is empty (not yet seeded), it degrades to a frame-only "Add
 * to bag" so the PDP keeps working.
 */

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon, type IconName } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import { LUMEN_WHATSAPP_E164 } from "@/lib/contact";
import { waMeUrl } from "@/lib/wa-link";
import { frameToCartItem, buildLensCartItem, type CartLens } from "@/lib/cart";
import {
  uploadRxInline,
  createManualRxInline,
  type InlineRxResult,
} from "@/app/(marketing)/shop/[slug]/rx-actions";
import {
  lensUnitPesewa,
  LENS_QUIZ_STORAGE_KEY,
  parseLensQuizHandoff,
  type LensCatalogueView,
  type LensAddonView,
  type LensQuizHandoff,
} from "@/lib/lens-catalogue";
import type { RxMethod } from "@/lib/checkout-schemas";
import type { ShopFrame } from "@/server/frames";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/atoms/toast";

const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Best seller",
  NEW: "New",
  LIMITED: "Limited edition",
};

/**
 * Plano = zero-power, non-prescription lenses (sun/blue-light without an Rx). The
 * slug is the stable convention; selecting it means the prescription step isn't
 * required. (DB carries no "requires_rx" flag — this is builder logic, not data.)
 */
const PLANO_LENS_TYPE_SLUG = "plano";

/**
 * Sentinel lens-type value for "frame only — no lenses". Not a catalogue slug (the
 * slug regex forbids underscores), so it can never collide with a real lens type.
 * Selecting it skips the lens build + prescription and prices the frame alone — for
 * customers reglazing at their own optician or buying frames for the look.
 */
const FRAME_ONLY_SLUG = "__frame_only__";

const GROUP_LABEL: Record<string, string> = {
  coating: "Coatings",
  sun: "Sun & tint",
  thickness: "Lens thickness",
};
const GROUP_ORDER = ["coating", "sun", "thickness"];

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
  /** Signed-in + flag on → can create a prescription inline (upload / manual). */
  canCreateRx: boolean;
  onFilePrescriptions: OnFilePrescription[];
};

const sectionLabel =
  "mb-2 text-xs font-medium uppercase tracking-wider text-[color:var(--lm-faint)]";

// ── Pure add-on selection helpers ─────────────────────────────────────────────

/** The default selection: every included add-on, with single-select groups normalised. */
function defaultAddonSlugs(catalogue: LensCatalogueView): Set<string> {
  const selected = new Set(catalogue.addons.filter((a) => a.included).map((a) => a.slug));
  return normaliseSingleSelect(catalogue, selected);
}

/** Ensure each single-select group has exactly one member selected (radio semantics). */
function normaliseSingleSelect(
  catalogue: LensCatalogueView,
  selected: Set<string>,
): Set<string> {
  const next = new Set(selected);
  const groups = new Map<string, LensAddonView[]>();
  for (const a of catalogue.addons) {
    if (!a.singleSelect) continue;
    const list = groups.get(a.group) ?? [];
    list.push(a);
    groups.set(a.group, list);
  }
  for (const [, list] of groups) {
    const chosen = list.filter((a) => next.has(a.slug));
    if (chosen.length === 0) {
      // Must always have one — default to the included option, else the first.
      const fallback = list.find((a) => a.included) ?? list[0];
      if (fallback) next.add(fallback.slug);
    } else if (chosen.length > 1) {
      // Keep the first, drop the rest.
      for (const extra of chosen.slice(1)) next.delete(extra.slug);
    }
  }
  return next;
}

/** Add a slug, replacing any sibling when it belongs to a single-select group. */
function withAddon(
  catalogue: LensCatalogueView,
  current: Set<string>,
  slug: string,
): Set<string> {
  const addon = catalogue.addons.find((a) => a.slug === slug);
  if (!addon) return current;
  const next = new Set(current);
  if (addon.singleSelect) {
    for (const other of catalogue.addons) {
      if (other.group === addon.group && other.singleSelect) next.delete(other.slug);
    }
  }
  next.add(slug);
  return next;
}

// ── Builder selection state (useReducer so the quiz prefill is a SINGLE dispatch
// in the mount effect — avoids React 19's set-state-in-effect lint, matching the
// cart provider's hydration pattern). colour/Rx are plain useState (event-driven).
type BuilderState = {
  lensTypeSlug: string;
  addonSlugs: Set<string>;
  openStep: number; // 0 colour · 1 lens · 2 add-ons · 3 Rx · -1 all collapsed
  quizNote: string | null;
};

type BuilderAction =
  | { type: "openStep"; step: number }
  | { type: "selectLensType"; slug: string }
  | { type: "toggleAddon"; addon: LensAddonView }
  | { type: "selectThickness"; catalogue: LensCatalogueView; addon: LensAddonView }
  | { type: "dismissNote" }
  | { type: "prefill"; catalogue: LensCatalogueView; handoff: LensQuizHandoff };

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "openStep":
      return { ...state, openStep: action.step };
    case "selectLensType":
      // Frame-only has no add-on/Rx steps to advance to → collapse instead.
      return {
        ...state,
        lensTypeSlug: action.slug,
        openStep: action.slug === FRAME_ONLY_SLUG ? -1 : 2,
      };
    case "toggleAddon": {
      if (action.addon.included) return state; // included add-ons are locked on
      const next = new Set(state.addonSlugs);
      if (next.has(action.addon.slug)) next.delete(action.addon.slug);
      else next.add(action.addon.slug);
      return { ...state, addonSlugs: next };
    }
    case "selectThickness":
      return {
        ...state,
        addonSlugs: withAddon(action.catalogue, state.addonSlugs, action.addon.slug),
      };
    case "dismissNote":
      return { ...state, quizNote: null };
    case "prefill": {
      const { catalogue, handoff } = action;
      let lensTypeSlug = state.lensTypeSlug;
      let typeName: string | null = null;
      if (handoff.lensTypeSlug) {
        const t = catalogue.lensTypes.find((x) => x.slug === handoff.lensTypeSlug);
        if (t) {
          lensTypeSlug = t.slug;
          typeName = t.name;
        }
      }
      let addonSlugs = state.addonSlugs;
      const valid = handoff.addonSlugs.filter((s) =>
        catalogue.addons.some((a) => a.slug === s),
      );
      for (const slug of valid) addonSlugs = withAddon(catalogue, addonSlugs, slug);
      if (typeName === null && valid.length === 0) return state; // nothing applied
      return {
        ...state,
        lensTypeSlug,
        addonSlugs,
        openStep: 1,
        quizNote: typeName
          ? `We pre-selected ${typeName} from your lens quiz — adjust anything below.`
          : "We pre-selected your lens quiz picks — adjust anything below.",
      };
    }
  }
}

export function FramePurchasePanel({
  frame,
  catalogue,
  prescriptionUploadEnabled,
  canCreateRx,
  onFilePrescriptions,
}: FramePurchasePanelProps) {
  const { add, open } = useCart();
  const { toast } = useToast();

  const hasBuilder = catalogue.lensTypes.length > 0;

  const [colorIndex, setColorIndex] = useState(0);
  const [rxMethod, setRxMethod] = useState<RxMethod | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  // Accordion + lens selection. Start at lens type (colour has a smart default).
  const [state, dispatch] = useReducer(builderReducer, undefined, () => ({
    lensTypeSlug: catalogue.lensTypes[0]?.slug ?? "",
    addonSlugs: defaultAddonSlugs(catalogue),
    openStep: 1,
    quizNote: null as string | null,
  }));
  const { lensTypeSlug, addonSlugs, openStep, quizNote } = state;

  // ── Quiz → builder prefill (runs once on mount, client-only, single dispatch) ─
  const prefillDone = useRef(false);
  useEffect(() => {
    if (prefillDone.current || !hasBuilder) return;
    prefillDone.current = true;
    const handoff = parseLensQuizHandoff(
      window.localStorage.getItem(LENS_QUIZ_STORAGE_KEY),
    );
    if (!handoff) return;
    // Consume it so it prefills once, not on every frame you open afterwards.
    try {
      window.localStorage.removeItem(LENS_QUIZ_STORAGE_KEY);
    } catch {
      /* storage disabled — ignore */
    }
    dispatch({ type: "prefill", catalogue, handoff });
  }, [hasBuilder, catalogue]);

  const color = frame.colors[colorIndex] ?? null;
  const outOfStock = frame.stock <= 0;
  const meta = [frame.material, frame.category?.name].filter(Boolean).join(" · ");

  const frameOnly = lensTypeSlug === FRAME_ONLY_SLUG;

  const lensUnit = useMemo(
    () =>
      hasBuilder && !frameOnly ? lensUnitPesewa(catalogue, lensTypeSlug, addonSlugs) : 0,
    [hasBuilder, frameOnly, catalogue, lensTypeSlug, addonSlugs],
  );
  const total = frame.price_ghs + lensUnit;

  const selectedType = catalogue.lensTypes.find((t) => t.slug === lensTypeSlug) ?? null;
  const isPlano = lensTypeSlug === PLANO_LENS_TYPE_SLUG;

  // Add-ons grouped for the builder (in GROUP_ORDER, server already sorted within).
  const addonGroups = useMemo(() => {
    const map = new Map<string, LensAddonView[]>();
    for (const a of catalogue.addons) {
      const list = map.get(a.group) ?? [];
      list.push(a);
      map.set(a.group, list);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      label: GROUP_LABEL[g] ?? g,
      addons: map.get(g)!,
    }));
  }, [catalogue]);

  // Add-on-only surcharge (excludes the lens type) for the step summary.
  const addonSurcharge = useMemo(
    () =>
      catalogue.addons.reduce(
        (sum, a) => (addonSlugs.has(a.slug) ? sum + a.price_ghs : sum),
        0,
      ),
    [catalogue, addonSlugs],
  );

  function toggleMultiAddon(addon: LensAddonView) {
    dispatch({ type: "toggleAddon", addon });
  }

  function selectSingleAddon(addon: LensAddonView) {
    dispatch({ type: "selectThickness", catalogue, addon });
  }

  // Rx is required to add — except plano (no prescription) and frame-only (no lenses).
  // `later` carries no Rx; onfile/upload/manual all resolve to an attached prescriptionId.
  const rxNeedsId = rxMethod === "onfile" || rxMethod === "upload" || rxMethod === "manual";
  const rxChosen = rxMethod === "later" || (rxNeedsId && !!prescriptionId);
  const rxSatisfied = isPlano || frameOnly || rxChosen;
  const canAdd =
    !outOfStock && !!color && (!hasBuilder || (!!lensTypeSlug && rxSatisfied));

  function handleAddToBag() {
    if (!canAdd) return;

    let item;
    if (!hasBuilder || frameOnly) {
      // No catalogue, or the customer chose frames without lenses → frame-only line.
      item = frameToCartItem(frame, colorIndex);
    } else {
      const chosenAddons = catalogue.addons.filter((a) => addonSlugs.has(a.slug));
      const lens: CartLens = {
        lensTypeSlug,
        lensTypeName: selectedType?.name ?? null,
        lensUnitPricePesewa: lensUnit,
        addonSlugs: chosenAddons.map((a) => a.slug),
        addonNames: chosenAddons.map((a) => a.name),
        // Plano has no prescription; otherwise carry the chosen method.
        rxMethod: isPlano ? null : rxMethod,
        prescriptionId: !isPlano && rxNeedsId ? prescriptionId : null,
      };
      item = buildLensCartItem(frame, colorIndex, lens);
    }

    if (!item) return;
    add(item);
    toast(`${frame.name}${color ? ` · ${color.name}` : ""} added to your bag.`);
    open();
  }

  // ── Accordion step summaries + done state ───────────────────────────────────
  const lensTypeSummary = frameOnly
    ? "Frame only · no lenses"
    : selectedType
      ? `${selectedType.name}${selectedType.price_ghs > 0 ? ` · + ${formatGhs(selectedType.price_ghs)}` : " · Included"}`
      : "Choose a lens type";
  const selectedAddonCount = catalogue.addons.filter((a) => addonSlugs.has(a.slug)).length;
  const addonSummary = `${selectedAddonCount} selected${addonSurcharge > 0 ? ` · + ${formatGhs(addonSurcharge)}` : ""}`;
  const rxSummary = isPlano
    ? "No prescription needed"
    : rxChosen
      ? rxMethod === "later"
        ? "Send it later"
        : rxMethod === "upload"
          ? "Uploaded · pending review"
          : rxMethod === "manual"
            ? "Entered · pending review"
            : "Using a prescription on file"
      : "Required to add to bag";

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Gallery — image angles only; colour is chosen once, in the builder step. */}
      <FrameGallery
        name={frame.name}
        shape={frame.shape}
        badge={frame.badge}
        photos={frame.photo_urls}
        colorHex={color?.hex ?? "var(--lm-text)"}
      />

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
          <p className="text-3xl font-medium" style={{ color: "var(--lm-warm-text)" }}>
            {formatGhs(total)}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--lm-faint)" }}>
            {!hasBuilder
              ? "Frame only · Lenses added at checkout"
              : frameOnly
                ? "Frame only · lenses not included"
                : lensUnit > 0
                  ? `Frame ${formatGhs(frame.price_ghs)} + lenses ${formatGhs(lensUnit)}`
                  : "Frame + lenses included"}
          </p>
        </div>

        {/* Quiz prefill note (dismissible) */}
        {quizNote && (
          <div
            className="flex items-start justify-between gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--lm-tint)", border: "1px solid var(--lm-hair)" }}
          >
            <span className="flex items-start gap-2.5 text-sm" style={{ color: "var(--lm-muted)" }}>
              <Icon name="check" size={15} className="mt-0.5 shrink-0 text-[color:var(--lm-sage-text)]" />
              {quizNote}
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: "dismissNote" })}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
              style={{ color: "var(--lm-faint)" }}
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        )}

        {hasBuilder ? (
          <>
            {/* Builder accordion */}
            <div className="flex flex-col" style={{ borderTop: "1px solid var(--lm-hair)" }}>
              {/* Step 1 — Colour */}
              <AccordionStep
                stepNum={1}
                title="Frame colour"
                summary={color?.name ?? "Choose a colour"}
                open={openStep === 0}
                done={!!color}
                onToggle={() => dispatch({ type: "openStep", step: openStep === 0 ? -1 : 0 })}
              >
                <div className="flex flex-col gap-2">
                  {frame.colors.map((c, i) => {
                    const selected = i === colorIndex;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setColorIndex(i);
                          dispatch({ type: "openStep", step: 1 });
                        }}
                        aria-pressed={selected}
                        className="flex items-center gap-4 rounded-xl px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                        style={{
                          border: `1px solid ${selected ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                          background: selected ? "var(--lm-tint)" : "transparent",
                        }}
                      >
                        <span
                          className="h-8 w-8 shrink-0 rounded-full"
                          style={{ backgroundColor: c.hex, boxShadow: "0 0 0 1px var(--lm-hair)" }}
                        />
                        <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionStep>

              {/* Step 2 — Lens type */}
              <AccordionStep
                stepNum={2}
                title="Lens type"
                summary={lensTypeSummary}
                open={openStep === 1}
                done={!!lensTypeSlug}
                onToggle={() => dispatch({ type: "openStep", step: openStep === 1 ? -1 : 1 })}
              >
                <div role="radiogroup" aria-label="Lens type" className="flex flex-col gap-2">
                  {catalogue.lensTypes.map((t) => {
                    const selected = t.slug === lensTypeSlug;
                    return (
                      <label
                        key={t.slug}
                        className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-4 py-3 transition-all"
                        style={{
                          border: `1px solid ${selected ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                          background: selected ? "var(--lm-tint)" : "transparent",
                        }}
                      >
                        <span className="flex min-w-0 items-start gap-3">
                          <input
                            type="radio"
                            name="lens-type"
                            checked={selected}
                            onChange={() => dispatch({ type: "selectLensType", slug: t.slug })}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--lm-warm)]"
                          />
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
                                    color: "var(--lm-sage-text)",
                                  }}
                                >
                                  {t.badge}
                                </span>
                              )}
                            </span>
                            {t.description && (
                              <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "var(--lm-faint)" }}>
                                {t.description}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
                          {t.price_ghs > 0 ? `+ ${formatGhs(t.price_ghs)}` : "Included"}
                        </span>
                      </label>
                    );
                  })}

                  {/* Frame only — escape hatch for shoppers who don't want lenses. */}
                  <label
                    className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{
                      border: `1px solid ${frameOnly ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                      background: frameOnly ? "var(--lm-tint)" : "transparent",
                    }}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        type="radio"
                        name="lens-type"
                        checked={frameOnly}
                        onChange={() => dispatch({ type: "selectLensType", slug: FRAME_ONLY_SLUG })}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--lm-warm)]"
                      />
                      <span className="min-w-0">
                        <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                          Frame only
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "var(--lm-faint)" }}>
                          No lenses — I&apos;ll have them fitted at my own optician.
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
                      Frame price
                    </span>
                  </label>
                </div>
              </AccordionStep>

              {/* Step 3 — Add-ons (grouped); hidden for frame-only / plano has its own */}
              {!frameOnly && addonGroups.length > 0 && (
                <AccordionStep
                  stepNum={3}
                  title="Add-ons & lens options"
                  summary={addonSummary}
                  open={openStep === 2}
                  done={selectedAddonCount > 0}
                  onToggle={() => dispatch({ type: "openStep", step: openStep === 2 ? -1 : 2 })}
                >
                  <div className="flex flex-col gap-5">
                    {addonGroups.map(({ group, label, addons }) => (
                      <div key={group}>
                        <p className={sectionLabel}>{label}</p>
                        <div className="flex flex-col gap-2">
                          {addons.map((a) =>
                            a.singleSelect ? (
                              <ThicknessOption
                                key={a.slug}
                                addon={a}
                                checked={addonSlugs.has(a.slug)}
                                onSelect={() => selectSingleAddon(a)}
                              />
                            ) : (
                              <AddonCheckbox
                                key={a.slug}
                                addon={a}
                                checked={addonSlugs.has(a.slug)}
                                onToggle={() => toggleMultiAddon(a)}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionStep>
              )}

              {/* Step 4 — Prescription (skipped entirely for frame-only) */}
              {!frameOnly && (
              <AccordionStep
                stepNum={4}
                title="Your prescription"
                summary={rxSummary}
                open={openStep === 3}
                done={rxSatisfied}
                onToggle={() => dispatch({ type: "openStep", step: openStep === 3 ? -1 : 3 })}
              >
                {isPlano ? (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--lm-muted)" }}>
                    Plano lenses have no vision correction, so there&apos;s no prescription
                    needed. Want corrective lenses instead? Pick a different lens type above.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs leading-relaxed" style={{ color: "var(--lm-muted)" }}>
                      Add your prescription now, or send it after checkout — your choice.
                    </p>

                    <div
                      role="radiogroup"
                      aria-label="How to share your prescription"
                      className="flex flex-col gap-2"
                    >
                      <RxRadioCard
                        checked={rxMethod === "later"}
                        onSelect={() => {
                          setRxMethod("later");
                          setPrescriptionId(null);
                        }}
                        icon="clock"
                        title="Send it later"
                        desc="We'll email you a reminder to share your prescription."
                      />

                      {prescriptionUploadEnabled && onFilePrescriptions.length > 0 && (
                        <div>
                          <RxRadioCard
                            checked={rxMethod === "onfile"}
                            onSelect={() => setRxMethod("onfile")}
                            icon="eye"
                            title="Use a prescription on file"
                            desc="Choose one you've already shared with us."
                          />
                          {rxMethod === "onfile" && (
                            <div
                              role="radiogroup"
                              aria-label="Saved prescriptions"
                              className="mt-2 ml-7 flex flex-col gap-1.5 border-l pl-4"
                              style={{ borderColor: "var(--lm-hair)" }}
                            >
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

                      {/* Inline create — signed-in only (the action requires auth). */}
                      {canCreateRx && (
                        <>
                          <div>
                            <RxRadioCard
                              checked={rxMethod === "upload"}
                              onSelect={() => {
                                setRxMethod("upload");
                                setPrescriptionId(null);
                              }}
                              icon="upload"
                              title="Upload it now"
                              desc="Add a photo or PDF of your prescription."
                            />
                            {rxMethod === "upload" && (
                              <InlineRxSubsection>
                                {prescriptionId ? (
                                  <RxCreatedNote onReset={() => setPrescriptionId(null)} />
                                ) : (
                                  <InlineRxUpload onCreated={setPrescriptionId} />
                                )}
                              </InlineRxSubsection>
                            )}
                          </div>

                          <div>
                            <RxRadioCard
                              checked={rxMethod === "manual"}
                              onSelect={() => {
                                setRxMethod("manual");
                                setPrescriptionId(null);
                              }}
                              icon="glasses"
                              title="Enter it manually"
                              desc="Type the values from your prescription."
                            />
                            {rxMethod === "manual" && (
                              <InlineRxSubsection>
                                {prescriptionId ? (
                                  <RxCreatedNote onReset={() => setPrescriptionId(null)} />
                                ) : (
                                  <InlineRxManual onCreated={setPrescriptionId} />
                                )}
                              </InlineRxSubsection>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Secondary helper links */}
                    <div
                      className="mt-1 flex flex-col gap-1 border-t pt-3 text-xs"
                      style={{ borderColor: "var(--lm-hair)", color: "var(--lm-faint)" }}
                    >
                      {prescriptionUploadEnabled && !canCreateRx && (
                        <p>
                          Have a prescription?{" "}
                          <Link
                            href={`/sign-in?redirect=${encodeURIComponent(`/shop/${frame.slug}`)}`}
                            className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                            style={{ color: "var(--lm-warm-text)" }}
                          >
                            Sign in to upload or enter it now
                          </Link>
                          .
                        </p>
                      )}
                      <p>
                        No prescription yet?{" "}
                        <Link
                          href="/book"
                          className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                          style={{ color: "var(--lm-warm-text)" }}
                        >
                          Book an eye test
                        </Link>{" "}
                        and we&apos;ll fit your new glasses with the results.
                      </p>
                    </div>
                  </div>
                )}
              </AccordionStep>
              )}
            </div>

            {/* Stock indicator */}
            <StockIndicator stock={frame.stock} />

            {/* Sticky total + CTA */}
            <div
              className="sticky bottom-4 z-10 mt-1 flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: "var(--lm-base)",
                border: "1px solid var(--lm-hair)",
                boxShadow: "0 14px 40px -16px var(--lm-shadow)",
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--lm-faint)" }}>
                  Your total
                </span>
                <span className="lm-display text-3xl leading-none" style={{ color: "var(--lm-text)" }}>
                  {formatGhs(total)}
                </span>
                {lensUnit > 0 && (
                  <span className="text-xs" style={{ color: "var(--lm-sage-text)" }}>
                    incl. lenses &amp; extras
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={!canAdd}
                className="lm-pill w-full shrink-0 justify-center px-6 py-3.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {outOfStock ? (
                  "Out of stock"
                ) : !rxSatisfied ? (
                  "Choose a prescription option"
                ) : (
                  <>
                    Add to bag <Icon name="arrow" size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Frame-only fallback (catalogue not yet seeded) */}
            {frame.colors.length > 0 && (
              <div>
                <p className={sectionLabel}>
                  Colour
                  {color ? <span style={{ color: "var(--lm-muted)" }}> · {color.name}</span> : null}
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

            <StockIndicator stock={frame.stock} />

            <button
              type="button"
              onClick={handleAddToBag}
              disabled={!canAdd}
              className="lm-pill w-full justify-center py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {outOfStock ? (
                "Out of stock"
              ) : (
                <>
                  Add to bag · {formatGhs(total)} <Icon name="arrow" size={16} />
                </>
              )}
            </button>

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
                  style={{ color: "var(--lm-warm-text)" }}
                >
                  +233 24 562 8432
                </a>
                .
              </p>
            </div>
          </>
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

/**
 * PDP gallery: a main stage + photo-angle thumbnails + an accessible zoom lightbox
 * when the frame has real photos; falls back to the procedural FrameSVG (recoloured
 * live from the builder's colour step) when none are uploaded yet. Photos are angles
 * (flat per frame) — colour is chosen ONCE in the builder, never duplicated here.
 */
function FrameGallery({
  name,
  shape,
  badge,
  photos,
  colorHex,
}: {
  name: string;
  shape: string | null;
  badge: string | null;
  photos: string[];
  colorHex: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const hasPhotos = photos.length > 0;
  const safeActive = Math.min(active, Math.max(0, photos.length - 1));

  // Lightbox: Esc closes, arrows navigate, body scroll locked while open.
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowRight") setActive((a) => (a + 1) % photos.length);
      else if (e.key === "ArrowLeft") setActive((a) => (a - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, photos.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main stage */}
      <div
        className="relative flex items-center justify-center rounded-2xl px-10 py-12"
        style={{ background: "var(--lm-deep)" }}
      >
        {badge && (
          <span
            className="absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: "color-mix(in srgb, var(--lm-blue) 12%, transparent)",
              color: "var(--lm-blue)",
            }}
          >
            {BADGE_LABEL[badge] ?? badge}
          </span>
        )}
        {hasPhotos ? (
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label={`Zoom in on ${name}`}
            className="group relative w-full max-w-sm rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
          >
            <Image
              src={photos[safeActive]}
              alt={`${name} — view ${safeActive + 1} of ${photos.length}`}
              width={480}
              height={320}
              className="h-auto w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
            <span
              className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: "var(--lm-base)", color: "var(--lm-warm-text)" }}
            >
              <Icon name="search" size={16} />
            </span>
          </button>
        ) : (
          <FrameSVG shape={shape} color={colorHex || "var(--lm-text)"} className="w-full max-w-sm" />
        )}
      </div>

      {/* Thumbnails — photo angles only (colour lives in the builder step) */}
      {hasPhotos && photos.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`${name} images`}>
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === safeActive}
              className="h-16 w-16 overflow-hidden rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
              style={{
                background: "var(--lm-deep)",
                boxShadow:
                  i === safeActive ? "0 0 0 2px var(--lm-warm)" : "0 0 0 1px var(--lm-hair)",
              }}
            >
              <Image src={p} alt="" width={64} height={64} className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoom && hasPhotos && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — enlarged images`}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4"
          style={{ background: "rgba(0,0,0,0.88)" }}
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Close"
            autoFocus
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
          >
            <Icon name="x" size={20} />
          </button>
          <Image
            src={photos[safeActive]}
            alt={`${name} — view ${safeActive + 1} of ${photos.length}`}
            width={1100}
            height={750}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] w-auto max-w-[92vw] object-contain"
          />
          {photos.length > 1 && (
            <div
              className="flex flex-wrap justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === safeActive}
                  className="h-12 w-12 overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{
                    boxShadow:
                      i === safeActive
                        ? "0 0 0 2px #fff"
                        : "0 0 0 1px rgba(255,255,255,0.3)",
                  }}
                >
                  <Image src={p} alt="" width={48} height={48} className="h-full w-full object-contain p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Accordion item: a real button header (a11y) + a body hidden when collapsed. */
function AccordionStep({
  stepNum,
  title,
  summary,
  open,
  done,
  onToggle,
  children,
}: {
  stepNum: number;
  title: string;
  summary: string;
  open: boolean;
  done: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const bodyId = `builder-step-body-${stepNum}`;
  const badgeStyle = open
    ? { background: "var(--lm-text)", color: "var(--lm-base)", border: "1px solid var(--lm-text)" }
    : done
      ? { background: "var(--lm-sage)", color: "#ffffff", border: "1px solid var(--lm-sage)" }
      : { background: "var(--lm-raise)", color: "var(--lm-muted)", border: "1px solid var(--lm-hair)" };

  return (
    <div style={{ borderBottom: "1px solid var(--lm-hair)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
      >
        <span className="flex min-w-0 items-center gap-3.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            style={badgeStyle}
          >
            {done && !open ? <Icon name="check" size={13} /> : stepNum}
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold" style={{ color: "var(--lm-text)" }}>
              {title}
            </span>
            {summary && (
              <span
                className="mt-0.5 block truncate text-sm"
                style={{ color: done && !open ? "var(--lm-muted)" : "var(--lm-faint)" }}
              >
                {summary}
              </span>
            )}
          </span>
        </span>
        <Icon
          name="chev"
          size={18}
          className="shrink-0 transition-transform duration-200"
          style={{ color: "var(--lm-muted)", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      <div id={bodyId} hidden={!open} className="pb-5">
        {children}
      </div>
    </div>
  );
}

/** Multi-select coating / sun add-on (checkbox card). */
function AddonCheckbox({
  addon,
  checked,
  onToggle,
}: {
  addon: LensAddonView;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className="flex items-start justify-between gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        border: `1px solid ${checked ? "var(--lm-warm)" : "var(--lm-hair)"}`,
        background: checked ? "var(--lm-tint)" : "transparent",
        cursor: addon.included ? "default" : "pointer",
      }}
    >
      <span className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={addon.included}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--lm-warm)]"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
              {addon.name}
            </span>
            {addon.included && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--lm-sage-text)" }}
              >
                Included
              </span>
            )}
          </span>
          {addon.description && (
            <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "var(--lm-faint)" }}>
              {addon.description}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
        {addon.price_ghs > 0 ? `+ ${formatGhs(addon.price_ghs)}` : "Free"}
      </span>
    </label>
  );
}

/** Single-select lens-thickness option (radio card). */
function ThicknessOption({
  addon,
  checked,
  onSelect,
}: {
  addon: LensAddonView;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        border: `1px solid ${checked ? "var(--lm-warm)" : "var(--lm-hair)"}`,
        background: checked ? "var(--lm-tint)" : "transparent",
      }}
    >
      <span className="flex min-w-0 items-start gap-3">
        <input
          type="radio"
          name={`thickness-${addon.group}`}
          checked={checked}
          onChange={onSelect}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--lm-warm)]"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
              {addon.name}
            </span>
            {addon.included && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--lm-sage-text)" }}
              >
                Default
              </span>
            )}
          </span>
          {addon.description && (
            <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "var(--lm-faint)" }}>
              {addon.description}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
        {addon.price_ghs > 0 ? `+ ${formatGhs(addon.price_ghs)}` : "Included"}
      </span>
    </label>
  );
}

/** Stock dot + label. */
function StockIndicator({ stock }: { stock: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {stock > 5 ? (
        <>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-sage)" }} />
          <span style={{ color: "var(--lm-sage-text)" }}>In stock</span>
        </>
      ) : stock > 0 ? (
        <>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-warm)" }} />
          <span style={{ color: "var(--lm-warm-text)" }}>Only {stock} left</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-faint)" }} />
          <span style={{ color: "var(--lm-faint)" }}>Out of stock</span>
        </>
      )}
    </div>
  );
}

/** A single Rx-method choice — a native radio styled as a card (accessible group). */
function RxRadioCard({
  checked,
  onSelect,
  icon,
  title,
  desc,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        border: `1px solid ${checked ? "var(--lm-warm)" : "var(--lm-hair)"}`,
        background: checked ? "var(--lm-tint)" : "transparent",
      }}
    >
      <input
        type="radio"
        name="rx-method"
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 shrink-0 accent-[color:var(--lm-warm)]"
      />
      <Icon name={icon} size={16} className="shrink-0 text-[color:var(--lm-warm-text)]" />
      <span>
        <span className="block text-sm font-medium" style={{ color: "var(--lm-text)" }}>
          {title}
        </span>
        <span className="block text-xs" style={{ color: "var(--lm-faint)" }}>
          {desc}
        </span>
      </span>
    </label>
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

// ── Inline prescription create (signed-in only) ───────────────────────────────

const rxInputClass =
  "w-full rounded-md border border-[color:var(--lm-hair)] bg-[var(--lm-raise)] px-3 py-2 text-sm text-[color:var(--lm-text)] placeholder:text-[color:var(--lm-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)] disabled:cursor-not-allowed disabled:opacity-50";
const rxErrorClass = "mt-1 text-xs text-[color:var(--lm-warm-text)]";

/** Indented sub-panel under the selected Rx create card. */
function InlineRxSubsection({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 ml-7 border-l pl-4" style={{ borderColor: "var(--lm-hair)" }}>
      {children}
    </div>
  );
}

/** Shown after a prescription is created inline — it's attached to the order. */
function RxCreatedNote({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span
        className="inline-flex items-center gap-2 font-medium"
        style={{ color: "var(--lm-sage-text)" }}
      >
        <Icon name="check" size={16} /> Added — pending review
      </span>
      <p className="text-xs" style={{ color: "var(--lm-muted)" }}>
        Our team will review it and update its status. It&apos;s attached to this order.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="lm-ghost self-start px-3 py-1.5 text-xs"
      >
        Use a different prescription
      </button>
    </div>
  );
}

/** Consent checkbox shared by the inline create forms. */
function RxConsent({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <>
      <label className="flex items-start gap-2 text-xs" style={{ color: "var(--lm-muted)" }}>
        <input
          type="checkbox"
          name="consent"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--lm-blue)]"
        />
        <span>
          I confirm this is my own prescription from a certified eye-care practitioner, and
          I consent to Lumen Eye Care securely storing it to process my order.
        </span>
      </label>
      {error && <p className={rxErrorClass}>{error}</p>}
    </>
  );
}

/** Inline file upload (compact — practitioner/date/notes live on the account page). */
function InlineRxUpload({ onCreated }: { onCreated: (id: string) => void }) {
  const [consent, setConsent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res: InlineRxResult = await uploadRxInline(fd);
      if (res.ok) onCreated(res.id);
      else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <RxConsent checked={consent} onChange={setConsent} error={fieldErrors.consent} />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--lm-text)" }}>
          Prescription file
        </span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          disabled={!consent}
          className={`${rxInputClass} file:mr-3 file:rounded file:border-0 file:bg-[var(--lm-tint)] file:px-2 file:py-1 file:text-xs file:text-[color:var(--lm-text)]`}
          aria-invalid={!!fieldErrors.file}
        />
        <span className="mt-1 block text-[11px]" style={{ color: "var(--lm-faint)" }}>
          JPG, PNG, WebP or PDF · up to 5 MB.
        </span>
        {fieldErrors.file && <p className={rxErrorClass}>{fieldErrors.file}</p>}
      </label>
      {error && (
        <p role="alert" className={rxErrorClass}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !consent}
        className="lm-pill justify-center px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload prescription"}
      </button>
    </form>
  );
}

// Manual Rx entry — one row of values per eye.
type EyeFields = { sph: string; cyl: string; axis: string; add: string };
const EMPTY_EYE: EyeFields = { sph: "", cyl: "", axis: "", add: "" };

function RxField({
  label,
  value,
  onChange,
  error,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  step: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "var(--lm-faint)" }}
      >
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={rxInputClass}
        aria-invalid={!!error}
      />
      {error && <p className={rxErrorClass}>{error}</p>}
    </label>
  );
}

function EyeRow({
  eyeLabel,
  fields,
  onField,
  errPrefix,
  fieldErrors,
}: {
  eyeLabel: string;
  fields: EyeFields;
  onField: (next: EyeFields) => void;
  errPrefix: "right" | "left";
  fieldErrors: Record<string, string>;
}) {
  const set = (k: keyof EyeFields) => (v: string) => onField({ ...fields, [k]: v });
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold" style={{ color: "var(--lm-text)" }}>
        {eyeLabel}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <RxField label="SPH" value={fields.sph} onChange={set("sph")} error={fieldErrors[`${errPrefix}.sph`]} step="0.25" placeholder="0.00" />
        <RxField label="CYL" value={fields.cyl} onChange={set("cyl")} error={fieldErrors[`${errPrefix}.cyl`]} step="0.25" placeholder="—" />
        <RxField label="Axis" value={fields.axis} onChange={set("axis")} error={fieldErrors[`${errPrefix}.axis`]} step="1" placeholder="—" />
        <RxField label="Add" value={fields.add} onChange={set("add")} error={fieldErrors[`${errPrefix}.add`]} step="0.25" placeholder="—" />
      </div>
    </div>
  );
}

function InlineRxManual({ onCreated }: { onCreated: (id: string) => void }) {
  const [right, setRight] = useState<EyeFields>(EMPTY_EYE);
  const [left, setLeft] = useState<EyeFields>(EMPTY_EYE);
  const [pd, setPd] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const input = { right, left, pd, consent };
    startTransition(async () => {
      const res: InlineRxResult = await createManualRxInline(input);
      if (res.ok) onCreated(res.id);
      else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <p className="text-xs leading-relaxed" style={{ color: "var(--lm-muted)" }}>
        Enter the values exactly as written on your prescription. SPH is required for each
        eye; if there&apos;s a cylinder (CYL) value, its axis goes with it.
      </p>
      <EyeRow eyeLabel="Right eye (OD)" fields={right} onField={setRight} errPrefix="right" fieldErrors={fieldErrors} />
      <EyeRow eyeLabel="Left eye (OS)" fields={left} onField={setLeft} errPrefix="left" fieldErrors={fieldErrors} />
      <div className="max-w-[8rem]">
        <RxField
          label="PD (mm)"
          value={pd}
          onChange={setPd}
          error={fieldErrors.pd}
          step="0.5"
          placeholder="optional"
        />
      </div>
      <RxConsent checked={consent} onChange={setConsent} error={fieldErrors.consent} />
      {error && (
        <p role="alert" className={rxErrorClass}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !consent}
        className="lm-pill justify-center px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save prescription"}
      </button>
    </form>
  );
}
