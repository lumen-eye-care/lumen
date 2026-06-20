"use client";

import Image from "next/image";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import { cartItemKey, lineUnitPricePesewa, type CartItem } from "@/lib/cart";
import { useCart } from "@/components/cart/cart-provider";

/**
 * One bag line — thumbnail, name/colour, qty steppers, remove, line total.
 * Shared by the cart drawer and the full /cart page. Reads handlers from the
 * cart context so callers just pass the item.
 */
export function CartLineItem({
  item,
  compact = false,
}: {
  item: CartItem;
  compact?: boolean;
}) {
  const { changeQty, remove } = useCart();
  const key = cartItemKey(item);
  const atMax = item.qty >= item.stock;

  return (
    <div className="flex gap-3 py-4">
      {/* Thumbnail */}
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg ${
          compact ? "h-16 w-16" : "h-20 w-20"
        }`}
        style={{ background: "var(--lm-deep)" }}
      >
        {item.photoUrl ? (
          <Image
            src={item.photoUrl}
            alt={`${item.name} frames`}
            width={compact ? 64 : 80}
            height={compact ? 64 : 80}
            className="h-full w-full object-contain p-1.5"
            sizes="80px"
          />
        ) : (
          <FrameSVG shape={item.shape} color={item.colorHex} className="w-[80%]" />
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium" style={{ color: "var(--lm-text)" }}>
              {item.name}
            </p>
            <p
              className="mt-0.5 flex items-center gap-1.5 text-xs"
              style={{ color: "var(--lm-faint)" }}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-[color:var(--lm-hair)]"
                style={{ backgroundColor: item.colorHex }}
              />
              {item.colorName}
            </p>
            {item.lens.lensTypeName && (
              <>
                <p
                  className="mt-1 truncate text-xs font-medium"
                  style={{ color: "var(--lm-muted)" }}
                >
                  {item.lens.lensTypeName}
                </p>
                {item.lens.addonNames.length > 0 && (
                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--lm-faint)" }}
                    title={item.lens.addonNames.join(" · ")}
                  >
                    {item.lens.addonNames.join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(key)}
            aria-label={`Remove ${item.name} from bag`}
            className="lm-tap flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
            style={{ color: "var(--lm-faint)" }}
          >
            <Icon name="trash" size={15} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {/* Qty stepper */}
          <div
            className="flex items-center rounded-md border"
            style={{ borderColor: "var(--lm-hair)" }}
          >
            <button
              type="button"
              onClick={() => changeQty(key, -1)}
              aria-label={item.qty <= 1 ? `Remove ${item.name}` : "Decrease quantity"}
              className="lm-tap flex h-8 w-8 items-center justify-center rounded-l-md transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
              style={{ color: "var(--lm-muted)" }}
            >
              <Icon name="minus" size={14} />
            </button>
            <span
              className="w-8 text-center text-sm tabular-nums"
              style={{ color: "var(--lm-text)" }}
              aria-label={`Quantity: ${item.qty}`}
            >
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => changeQty(key, 1)}
              disabled={atMax}
              aria-label="Increase quantity"
              title={atMax ? `Only ${item.stock} in stock` : undefined}
              className="lm-tap flex h-8 w-8 items-center justify-center rounded-r-md transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ color: "var(--lm-muted)" }}
            >
              <Icon name="plus" size={14} />
            </button>
          </div>

          <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
            {formatGhs(lineUnitPricePesewa(item) * item.qty)}
          </span>
        </div>
      </div>
    </div>
  );
}
