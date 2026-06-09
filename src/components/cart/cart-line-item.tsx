"use client";

import Image from "next/image";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import { cartItemKey, type CartItem } from "@/lib/cart";
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
        className={`flex shrink-0 items-center justify-center rounded-lg bg-[#F6F2EB] ${
          compact ? "h-16 w-16" : "h-20 w-20"
        }`}
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
            <p className="truncate font-medium text-lumen-ink">{item.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-lumen-ink/50">
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-lumen-ink/15"
                style={{ backgroundColor: item.colorHex }}
              />
              {item.colorName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(key)}
            aria-label={`Remove ${item.name} from bag`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lumen-ink/40 transition-colors hover:bg-lumen-ink/5 hover:text-lumen-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {/* Qty stepper */}
          <div className="flex items-center rounded-md border border-lumen-ink/15">
            <button
              type="button"
              onClick={() => changeQty(key, -1)}
              aria-label={item.qty <= 1 ? `Remove ${item.name}` : "Decrease quantity"}
              className="flex h-8 w-8 items-center justify-center rounded-l-md text-lumen-ink/70 transition-colors hover:bg-lumen-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              <Icon name="minus" size={14} />
            </button>
            <span
              className="w-8 text-center text-sm tabular-nums text-lumen-ink"
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
              className="flex h-8 w-8 items-center justify-center rounded-r-md text-lumen-ink/70 transition-colors hover:bg-lumen-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>

          <span className="text-sm font-medium text-lumen-ink">
            {formatGhs(item.unitPricePesewa * item.qty)}
          </span>
        </div>
      </div>
    </div>
  );
}
